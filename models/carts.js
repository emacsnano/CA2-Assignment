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
            where: { member_id: memberId },
            include: {
                items: {
                    include: {
                        product: true  // Include full product details
                    },
                    orderBy: {
                        cart_item_id: 'asc'  // Optional: order items
                    }
                }
            }
        });
    }
}