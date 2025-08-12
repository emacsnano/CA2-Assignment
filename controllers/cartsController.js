// you can modify the code below to suit your needs
const { EMPTY_RESULT_ERROR, UNIQUE_VIOLATION_ERROR } = require('../errors');
const cartsModel = require('../models/carts');

// Add items to the cart
module.exports.createCartItems = async function (req, res) {
    try {
        console.log('Request body:', req.body);

        const { productId, quantity = 1 } = req.body;
        const userId = req.user.memberId;
        
        const productIdNum = Number(productId);
        const quantityNum = Number(quantity);

        // Input validation
        if (!productIdNum || !quantityNum || quantityNum <= 0) {
            return res.status(400).json({ 
                message: 'Product ID and positive quantity are required' 
            });
        }

        const item = await cartsModel.addItemToCart(userId, productId, quantity);
        
        res.status(201).json(item);
    } catch (err) {
        // Error handling
        if (err.message.includes('Product not found') || err.message.includes('Insufficient stock')) {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: 'Failed to add item to cart' });
    }
}

// Update items in the cart
module.exports.updateCartItems = function (req, res) {

}

// Get all items in the cart
module.exports.retrieveCartItems = async function (req, res) {
    try {
        const userId = req.user.memberId;
        
        // Get cart with items and product details
        const cart = await cartsModel.getCartWithItems(userId);
        
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        res.status(200).json({data: cart.items || []});
    } catch (error) {
        console.error('Error retrieving cart items:', error);
        res.status(500).json({ message: 'Failed to retrieve cart items'});
    }
}

module.exports.deleteCartItems = function (req, res) {

}

module.exports.getCartSummary = function (req, res) {

}