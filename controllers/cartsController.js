// you can modify the code below to suit your needs
const { EMPTY_RESULT_ERROR, UNIQUE_VIOLATION_ERROR } = require('../errors');
const cartsModel = require('../models/carts');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

////////////////////////////////////////////////////////////
// Cart CRUD Functionality
////////////////////////////////////////////////////////////

// Add items to the cart
module.exports.createCartItems = async function (req, res) {
    try {
        console.log('Request body:', req.body);

        const { productId, quantity = 1 } = req.body;
        const userId = req.user.memberId;
        
        const productIdNum = Number(productId);
        const quantityNum = Number(quantity);

        // Input Validation if quantity is < 0, or if no Id or quantity
        if (!productIdNum || !quantityNum || quantityNum <= 0) {
            return res.status(400).json({ 
                message: 'Product ID and positive quantity are required' 
            });
        }

        const item = await cartsModel.addItemToCart(userId, productId, quantity);
        
        res.status(201).json(item);
    } catch (err) {
        if (err.message.includes('Product not found') || err.message.includes('Insufficient stock')) {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: 'Failed to add item to cart' });
    }
}

// Update item in the cart
module.exports.updateCartItems = async function (req, res) {
    try {
        const { productId, quantity } = req.body;
        const memberId = req.user.memberId;

        if (!productId || !quantity) {
            return res.status(400).json({ error: 'Missing productId or quantity' });
        }

        const updatedItem = await cartsModel.updateCartItem(memberId, productId, quantity);
        
        res.status(200).json({
            message: 'Cart item updated successfully',
            cartItem: updatedItem
        });
    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to update cart item'
        });
    }
}

// Get all items in the cart
module.exports.retrieveCartItems = async function (req, res) {
    try {
        const userId = req.user.memberId;
        const cart = await cartsModel.getCartWithItems(userId);
        
        if (!cart) {
            return res.status(404).json({ 
                error: 'Cart not found',
                cartItems: []
            });
        }

        res.status(200).json({
            cartItems: cart.items.map(item => ({
                productId: item.product_id,
                quantity: item.quantity,
                product: {
                    id: item.product.id,
                    description: item.product.description,
                    country: item.product.country,
                    unitPrice: item.product.unit_price
                }
            }))
        });
    } catch (error) {
        console.error('Error retrieving cart items:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve cart items',
            cartItems: []
        });
    }
}

// Delete item in the cart
module.exports.deleteCartItems = async function (req, res) {
    try {
        const { productId } = req.body;
        const memberId = req.user.memberId;

        if (!productId) {
            return res.status(400).json({ error: 'Missing productId' });
        }

        await cartsModel.deleteCartItem(memberId, productId);
        
        res.status(200).json({
            message: 'Cart item deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting cart item:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to delete cart item'
        });
    }
}

// Get summary of the cart
module.exports.getCartSummary = async function (req, res) {
    try {
        const userId = req.user.memberId;
        const summary = await cartsModel.calculateCartSummary(userId);
        
        res.status(200).json({ 
            cartSummary: summary 
        });
    } catch (error) {
        console.error('Controller error retrieving cart summary:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve cart summary',
            cartSummary: { 
                totalQuantity: 0, 
                totalPrice: 0 
            }
        });
    }
}

////////////////////////////////////////////////////////////
// Add discount to cart
////////////////////////////////////////////////////////////

// Helper functions (defined outside exports)
async function calculateCartTotals(cart) {
    const validItems = cart.items.filter(item => 
        item.product.stock_quantity >= item.quantity
    );

    const subtotal = validItems.reduce((sum, item) => 
        sum + (item.product.unit_price * item.quantity), 0);

    // Calculate all applicable discounts
    const applicableDiscounts = await prisma.discount_rules.findMany({
        where: {
            is_active: true,
            products: {
                some: {
                    product_id: {
                        in: validItems.map(i => i.product_id)
                    }
                }
            }
        },
        include: {
            products: true
        }
    });

    // Apply discounts
    const appliedDiscounts = applicableDiscounts.map(discount => {
        const discountableItems = validItems.filter(item =>
            discount.products.some(p => p.product_id === item.product_id)
        );
        
        const discountAmount = discountableItems.reduce((sum, item) =>
            sum + (item.product.unit_price * item.quantity * discount.discount_percentage / 100), 0);
        
        return {
            id: discount.id,
            name: discount.name,
            type: discount.type,
            percentage: Number(discount.discount_percentage),
            amount: discountAmount,
            products: discount.products
        };
    });

    const totalDiscount = appliedDiscounts.reduce((sum, d) => sum + d.amount, 0);

    return {
        items: validItems.map(item => ({
            ...item,
            subtotal: item.product.unit_price * item.quantity,
            product: {
                ...item.product,
                available: item.product.stock_quantity >= item.quantity
            }
        })),
        appliedDiscounts,
        totals: {
            subtotal,
            discount: totalDiscount,
            total: subtotal - totalDiscount
        }
    };
}

async function getAvailableDiscounts(memberId, subtotal = 0) {
    const cart = await prisma.cart.findUnique({
        where: { member_id: memberId },
        include: { 
            items: { 
                select: { product_id: true } 
            } 
        }
    });

    if (!cart?.items?.length) return [];

    const productIds = cart.items.map(i => i.product_id);
    const now = new Date();

    return await prisma.discount_rules.findMany({
        where: {
            is_active: true,
            created_at: { lte: now },
            OR: [
                // Product-specific discounts
                {
                    type: 'product',
                    products: {
                        some: { product_id: { in: productIds } }
                    }
                },
                // Cart-wide discounts
                {
                    type: 'cart',
                    min_cart_value: { lte: subtotal }
                }
            ]
        },
        select: {
            id: true,
            name: true,
            type: true,
            discount_percentage: true,
            min_cart_value: true
        }
    });
}

module.exports.getCart =  async function(req, res) {
        try {
            if (!req.user?.memberId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const cart = await prisma.cart.findUnique({
                where: { member_id: req.user.memberId },
                include: { 
                    items: { 
                        include: { 
                            product: true 
                        } 
                    },
                    discount_rule: true 
                }
            });

            if (!cart) {
                return res.status(404).json({ error: "Cart not found" });
            }

            // Auto-apply first eligible discount if none is set
            if (!cart.discount_rule_id) {
                const eligibleDiscounts = await prisma.discount_rules.findMany({
                    where: {
                        is_active: true,
                        products: {
                            some: {
                                product_id: {
                                    in: cart.items.map(i => i.product_id)
                                }
                            }
                        }
                    }
            });
    
            if (eligibleDiscounts.length > 0) {
                await prisma.cart.update({
                    where: { member_id: memberId },
                    data: { discount_rule_id: eligibleDiscounts[0].id }
            });
            cart.discount_rule_id = eligibleDiscounts[0].id;
        }
    }

            // Check if current discount is still valid
            if (cart.discount_rule) {
                const now = new Date();
                const isActive = cart.discount_rule.is_active &&
                    (!cart.discount_rule.start_date || cart.discount_rule.start_date <= now) &&
                    (!cart.discount_rule.end_date || cart.discount_rule.end_date >= now);

                if (!isActive) {
                    // Remove expired/inactive discount
                    await prisma.cart.update({
                        where: { member_id: req.user.memberId },
                        data: { discount_rule_id: null }
                    });
                    cart.discount_rule = null;
                }
            }

            const cartData = await calculateCartTotals(cart);
            cartData.availableDiscounts = await getAvailableDiscounts(
                req.user.memberId, 
                cartData.totals.subtotal
            );
            
            res.json(cartData);

        } catch (error) {
            console.error('Error getting cart:', error);
            res.status(500).json({ 
                error: "Failed to get cart",
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

module.exports.applyDiscount =  async function(req, res) {
        try {
            const { discount_rule_id } = req.body;
            
            if (!req.user?.memberId) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            
            if (!discount_rule_id) {
                return res.status(400).json({ error: "Discount rule ID is required" });
            }

            // Verify discount exists and is valid
            const discount = await prisma.discount_rules.findUnique({
                where: { 
                    id: discount_rule_id,
                    is_active: true
                },
                include: {
                    discount_rule_products: true
                }
            });

            if (!discount) {
                return res.status(404).json({ error: "Discount not found or inactive" });
            }

            // Check if discount applies to cart
            const cart = await prisma.cart.findUnique({
                where: { member_id: req.user.memberId },
                include: { 
                    items: { 
                        select: { product_id: true } 
                    } 
                }
            });

            const productIds = cart.items.map(i => i.product_id);
            const discountProductIds = discount.discount_rule_products.map(d => d.product_id);
            const hasProductDiscount = discountProductIds.some(id => productIds.includes(id));

            // Check minimum cart value if no product-specific discount
            if (!hasProductDiscount && discount.min_cart_value) {
                const subtotal = cart.items.reduce((sum, item) => 
                    sum + (item.product.unit_price * item.quantity), 0);
                
                if (subtotal < Number(discount.min_cart_value)) {
                    return res.status(400).json({ 
                        error: `Minimum cart value of $${discount.min_cart_value} required for this discount`
                    });
                }
            }

            // Apply discount
            const updatedCart = await prisma.cart.update({
                where: { member_id: req.user.memberId },
                data: { discount_rule_id },
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    },
                    discount_rule: true
                }
            });

            // Return updated cart with calculations
            const cartData = await calculateCartTotals(updatedCart);
            res.json(cartData);

        } catch (error) {
            console.error('Error applying discount:', error);
            res.status(500).json({ 
                error: "Failed to apply discount",
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

module.exports.removeDiscount =  async function(req, res) {
        try {
            if (!req.user?.memberId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const updatedCart = await prisma.cart.update({
                where: { member_id: req.user.memberId },
                data: { discount_rule_id: null },
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    }
                }
            });

            const cartData = await calculateCartTotals(updatedCart);
            res.json(cartData);

        } catch (error) {
            console.error('Error removing discount:', error);
            res.status(500).json({ 
                error: "Failed to remove discount",
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

////////////////////////////////////////////////////////////
// Process checkout using stored procedure
////////////////////////////////////////////////////////////

// Process checkout
module.exports.processCheckout = async function(req, res) {
    try {
        if (!req.user?.memberId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Execute stored procedure
        const result = await prisma.$queryRaw`
            CALL place_order(${req.user.memberId}, null, null)
        `;
        
        // Convert BigInt to string for JSON serialization
        const response = {
            success: !!result[0].p_order_id,
            orderId: result[0].p_order_id?.toString(), // Convert to string
            message: result[0].p_message
        };
        
        res.json(response);
    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({ 
            error: "Checkout failed",
            details: error.message
        });
    }
}

// Admin function for setting discount (Not Working)
// module.exports.getCartWithDiscounts = async function(memberId) {
//     try {
//             const cart = await prisma.cart.findUnique({
//                 where: { member_id: memberId },
//                 include: { 
//                     items: { 
//                         include: { 
//                             product: {
//                                 select: {
//                                     id: true,
//                                     name: true,
//                                     unit_price: true
//                                 }
//                             } 
//                         } 
//                     } 
//                 }
//             });

//             if (!cart?.items?.length) {
//                 return { 
//                     items: [], 
//                     discounts: [], 
//                     totals: {
//                         subtotal: 0,
//                         discount: 0,
//                         total: 0
//                     }
//                 };
//             }

//             const productIds = cart.items.map(i => i.product_id);
//             const discounts = await prisma.discount_rules.findMany({
//                 where: {
//                     is_active: true,
//                     OR: [
//                         { product_id: { in: productIds } },
//                         { products: { some: { product_id: { in: productIds } } } }
//                     ]
//                 }
//             });

//             const subtotal = cart.items.reduce((sum, item) => 
//                 sum + (item.product.unit_price * item.quantity), 0);
            
//             const discountAmount = discounts.reduce((sum, d) => 
//                 sum + (subtotal * (d.discount_percentage / 100)), 0);

//             return {
//                 items: cart.items.map(item => ({
//                     ...item,
//                     subtotal: item.product.unit_price * item.quantity
//                 })),
//                 discounts,
//                 totals: {
//                     subtotal,
//                     discount: discountAmount,
//                     total: subtotal - discountAmount
//                 }
//             };
//         } catch (error) {
//             console.error('Error getting cart with discounts:', error);
//             throw new Error("Failed to get cart with discounts: " + error.message);
//         }
//     }
