document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // DOM Elements
    const cartContainer = document.getElementById('cart-container');
    const cartItemsEl = document.getElementById('cart-items');
    const discountsEl = document.getElementById('discounts');
    const subtotalEl = document.getElementById('subtotal');
    const discountTotalEl = document.getElementById('discount-total');
    const totalEl = document.getElementById('total');
    const checkoutBtn = document.getElementById('checkout-button');
    const errorContainer = document.getElementById('error-container');

    async function loadCart() {
        try {
            // Show loading state
            cartItemsEl.innerHTML = '<div class="loading-spinner"></div>';
            errorContainer.style.display = 'none';

            const response = await fetch('/carts/cart', {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                credentials: 'include' // Important for session cookies
            });

            const responseClone = response.clone();

            // First check if response is OK (status 200-299)
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server responded with:', errorText);
                throw new Error(`Server error: ${response.status} - ${errorText.substring(0, 100)}`);
            }

            // Explicitly check for JSON content
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const responseBody = await responseClone.text();
                console.error('Non-JSON response received:', {
                    status: response.status,
                    headers: Object.fromEntries(response.headers.entries()),
                    body: responseBody
            });
            throw new Error(`Expected JSON but got ${contentType}`);
        }

            const cartData = await response.json();
            
            // Validate response structure
            if (!cartData || typeof cartData !== 'object') {
                console.error('Invalid cart data structure received:', cartData);
                throw new Error('Invalid cart data structure');
            }

            renderCart(cartData);

        } catch (error) {
            console.error('Full error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
        showError(error.message || 'Failed to load cart');
        }
    }

    function renderCart(data) {
        // Safely extract data with defaults
        const { items = [], totals = {}, appliedDiscount } = data;
        const { subtotal = 0, discount = 0, total = 0 } = totals;

        // 1. Render Cart Items
        cartItemsEl.innerHTML = items.length 
            ? items.map(item => {
                const isDiscounted = appliedDiscount?.type === 'product' && 
                               appliedDiscount.products?.some(p => p.product_id === item.product_id);
            
                return `
                    <div class="cart-item">
                        <div class="item-info">
                            <span class="item-name">${item.product?.name || 'Unknown product'}</span>
                            <span class="item-quantity">(${item.quantity})</span>
                        </div>
                        <div class="item-price">
                            $${(item.product?.unit_price * item.quantity).toFixed(2)}
                            ${isDiscounted 
                                ? `<span class="discount-badge">${appliedDiscount.percentage}% OFF</span>` 
                                : ''}
                        </div>
                    </div>
                    </br>
                `;
            }).join('')
            : '<p class="empty-cart">Your cart is empty</p>';

        // 2. Render Discounts Section
        const discountsEl = document.getElementById('discounts');
        if (data.appliedDiscounts && data.appliedDiscounts.length > 0) {
            discountsEl.innerHTML = `
                <div class="discounts-header">Applied Discounts</div>
                ${data.appliedDiscounts.map(discount => `
                    <div class="discount-item">
                        <span class="discount-name">${discount.name}</span>
                        <span class="discount-value">-$${discount.amount.toFixed(2)}</span>
                    </div>
                    </br>
                `).join('')}
            `;
        } else {
            discountsEl.innerHTML = '<p class="no-discounts">No discounts applied</p>';
        }

            // 3. Update Totals
            subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
            discountTotalEl.textContent = `-$${discount.toFixed(2)}`;
            totalEl.textContent = `$${total.toFixed(2)}`;
        }

    function showError(message) {
        errorContainer.innerHTML = `
            <div class="error-message">
                <p>${message}</p>
                <button class="retry-btn">Try Again</button>
            </div>
        `;
        errorContainer.style.display = 'block';
        
        document.querySelector('.retry-btn').addEventListener('click', loadCart);
    }

    // Handle checkout
    async function handleCheckout() {
    try {
        checkoutBtn.disabled = true;
        checkoutBtn.textContent = 'Processing...';
        
        const response = await fetch('/carts/checkout', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Checkout failed');
        }

        if (result.success) {
            // Show success message
            const messageEl = document.createElement('div');
            messageEl.className = 'success-message';
            messageEl.innerHTML = `
                <p>${result.message}</p>
                <p>Order ID: ${result.orderId}</p>
            `;
            cartContainer.appendChild(messageEl);
            
            // Reload cart to show remaining items
            await loadCart();
        } else {
            // Show warning about insufficient stock
            showError(result.message);
        }
    } catch (error) {
        showError(error.message);
    }
    }

    // Update event listener 
    checkoutBtn.addEventListener('click', handleCheckout);

    // Initial load
    loadCart();
});