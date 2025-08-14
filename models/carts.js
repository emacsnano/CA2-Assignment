// const { query } = require('../database');
// const { EMPTY_RESULT_ERROR, SQL_ERROR_CODE, UNIQUE_VIOLATION_ERROR } = require('../errors');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
  async getOrCreateCart(memberId) {
    return await prisma.cart.upsert({
      where: { member_id: memberId },
      update: {},
      create: { member_id: memberId },
      include: { 
        items: {
          include: {
            product: true
          }
        }
      }
    });
  },

  async addItemToCart(memberId, productId, quantity = 1) {
    productId = Number(productId);
    quantity = Number(quantity);

    try {
      // Validate quantity
      if (quantity <= 0) throw new Error('Quantity must be positive');
      
      // Check product exists and has stock
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });
      
      if (!product) throw new Error('Product not found');
      if (product.stock_quantity < quantity) {
        throw new Error(`Only ${product.stock_quantity} items available`);
      }

      // Get or create cart
      const cart = await this.getOrCreateCart(memberId);

      // Transaction for atomic operations
      const [cartItem] = await prisma.$transaction([
        prisma.cart_item.upsert({
          where: {
            cart_id_product_id: {
              cart_id: cart.cart_id,
              product_id: productId
            }
          },
          update: {
            quantity: { increment: quantity }
          },
          create: {
            cart_id: cart.cart_id,
            product_id: productId,
            quantity: quantity
          },
          include: {
            product: true
          }
        }),
        // Update product stock
        prisma.product.update({
          where: { id: productId },
          data: { stock_quantity: { decrement: quantity } }
        })
      ]);

      return cartItem;
    } catch (error) {
      console.error('Error in addItemToCart:', error);
      throw error; // Rethrow for controller to handle
    }
  },

  async getCartWithItems(memberId) {
        return await prisma.cart.findUnique({
            where: { 
            member_id: memberId 
        },
        include: {
            items: {
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            unit_price: true,
                            country: true
                        }
                    }
                },
                orderBy: {
                    cart_item_id: 'asc'
                }
            }
        }
        });
  },

  async calculateCartSummary(memberId) {
    try {
        const cart = await this.getCartWithItems(memberId);
        
        if (!cart?.items?.length) {
            return { totalQuantity: 0, totalPrice: 0 };
        }

        const summary = cart.items.reduce((acc, item) => {
            // Access unit_price directly
            const unitPrice = Number(item.product?.unit_price) || 0;
            const quantity = Number(item.quantity) || 0;
            
            console.log(`Product ${item.product?.id}:`, {
                name: item.product?.name,
                unitPrice: unitPrice,
                quantity: quantity
            });

            return {
                totalQuantity: acc.totalQuantity + quantity,
                totalPrice: acc.totalPrice + (unitPrice * quantity)
            };
        }, { totalQuantity: 0, totalPrice: 0 });

        return {
            totalQuantity: summary.totalQuantity,
            totalPrice: parseFloat(summary.totalPrice.toFixed(2))
        };
    } catch (error) {
        console.error('Cart summary error:', error);
        throw error;
    }
  },

  async updateCartItem(memberId, productId, quantity) {
    try {
        // Get the cart first
        const cart = await this.getOrCreateCart(memberId);
        
        // Transaction for atomic operations
        return await prisma.$transaction([
            prisma.cart_item.update({
                where: {
                    cart_id_product_id: {
                        cart_id: cart.cart_id,
                        product_id: productId
                    }
                },
                data: {
                    quantity: quantity
                },
                include: {
                    product: true
                }
            }),
            // Update product stock if needed
        ]);
    } catch (error) {
        console.error('Error in updateCartItem:', error);
        throw error;
    }
},

  async deleteCartItem(memberId, productId) {
    try {
        const cart = await this.getOrCreateCart(memberId);
        
        // First get the item to get the quantity
        const item = await prisma.cart_item.findUnique({
            where: {
                cart_id_product_id: {
                    cart_id: cart.cart_id,
                    product_id: productId
                }
            }
        });

        if (!item) throw new Error('Item not found in cart');

        await prisma.$transaction([
            // Delete the cart item
            prisma.cart_item.delete({
                where: {
                    cart_id_product_id: {
                        cart_id: cart.cart_id,
                        product_id: productId
                    }
                }
            }),
            // Return stock to inventory - using item.quantity instead of undefined quantity
            prisma.product.update({
                where: { id: productId },
                data: {
                    stock_quantity: {
                        increment: item.quantity // Use the quantity from the found item
                    }
                }
            })
        ]);

        return true;
    } catch (error) {
        console.error('Delete cart item error:', error);
        throw error;
    }
  },



  async getCartWithItems(memberId) {
    return await prisma.cart.findUnique({
      where: { member_id: memberId },
      include: {
        items: {
          include: {
            product: {
              include: {
                discount_rules: {
                  include: {
                    discount_rule: true
                  }
                }
              }
            }
          }
        }
      }
    });
  }
}
