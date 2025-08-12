window.addEventListener('DOMContentLoaded', function () {
    console.log('DOM fully loaded and parsed');

    // Get all elements first
    const form = document.querySelector('form');
    const productIdInput = document.getElementById('productId');
    const quantityInput = document.getElementById('quantity');
    const cartProductIdSpan = document.getElementById('cart-product-id');

    console.log('Form elements:', {
        form: form,
        productIdInput: productIdInput,
        quantityInput: quantityInput,
        cartProductIdSpan: cartProductIdSpan
    });

    const token = localStorage.getItem("token");
    const memberId = localStorage.getItem("memberId");
    const cartProductId = localStorage.getItem("cartProductId");

    console.log('Retrieved from localStorage:', {token, memberId, cartProductId});

    // Set product ID if available
    if (productIdInput && cartProductId) {
        console.log('Setting product ID to:', cartProductId);
        productIdInput.value = cartProductId;
        if (cartProductIdSpan) {
            cartProductIdSpan.textContent = cartProductId;
        }
    }

    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const productId = this.querySelector("input[name='productId']").value;
            const quantity = this.querySelector("input[name='quantity']").value || 1;

            try {
                console.log('Sending:', { productId, quantity });

                const response = await fetch('/carts/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ productId, quantity })
                });

                console.log('Received response, status:', response.status);
                const data = await response.json();
                console.log('Response data:', data);
                
                if (response.ok) {
                    alert('Item added to cart! Redirecting to products...');
                    window.location.href = '/cart/retrieve/all';
                } else {
                    alert(`Error: ${data.message || 'Failed to add item to cart'}`);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Network error - please check console');
            }
        });
    }
});
