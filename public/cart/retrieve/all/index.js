window.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem("token");
    
    if (!token) {
        window.location.href = "/login";
        return;
    }

    const checkoutButton = document.getElementById("checkout-button");
    if (checkoutButton) {
        checkoutButton.addEventListener("click", function () {
            window.location.href = "/checkout";
        });
    }

    // Clear previous content while loading
    const tbody = document.querySelector("#cart-items-tbody");
    const summaryDiv = document.querySelector("#cart-summary");
    if (tbody) tbody.innerHTML = "<tr><td colspan='7'>Loading cart...</td></tr>";
    if (summaryDiv) summaryDiv.innerHTML = "Loading summary...";

    fetchCartItems(token)
        .then(function () {
            return fetchCartSummary(token);
        })
        .catch(function (error) {
            console.error("Failed to load cart:", error);
            if (tbody) tbody.innerHTML = "<tr><td colspan='7'>Error loading cart</td></tr>";
            if (summaryDiv) summaryDiv.textContent = "Error loading cart summary";
        });
});

function fetchCartItems(token) {
    return fetch('/carts/all', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    })
    .then(body => {
        console.log('Debug - Full response:', body);

        if (body.error) throw new Error(body.error);
        
        const tbody = document.querySelector("#cart-items-tbody");
        tbody.innerHTML = ""; // Clear existing content
        
        if (!body.cartItems || body.cartItems.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7">Your cart is empty</td></tr>`;
            return;
        }

        // Create table rows for each cart item
        body.cartItems.forEach(cartItem => {
            console.log('Debug - Cart item:', cartItem);

            const row = document.createElement("tr");
            
            // Product Description
            const descCell = document.createElement("td");
            descCell.textContent = cartItem.product?.description || "N/A";
            
            // Country
            const countryCell = document.createElement("td");
            countryCell.textContent = cartItem.product?.country || "N/A";
            
            // Sub-total Price
            const subTotalCell = document.createElement("td");
            const unitPrice = Number(
                cartItem.product?.unitPrice || 
                cartItem.product?.unit_price || 
                cartItem.product?.price || 
                0
            );
            const quantity = cartItem.quantity || 0;
            subTotalCell.textContent = `$${(unitPrice * quantity).toFixed(2)}`;
            
            // Unit Price
            const unitPriceCell = document.createElement("td");
            unitPriceCell.textContent = `$${unitPrice.toFixed(2)}`;
            
            // Quantity (editable input)
            const quantityCell = document.createElement("td");
            const quantityInput = document.createElement("input");
            quantityInput.type = "number";
            quantityInput.min = "1";
            quantityInput.value = quantity;
            quantityInput.classList.add("quantity-input");
            quantityCell.appendChild(quantityInput);
            
            // Update Button
            const updateCell = document.createElement("td");
            const updateButton = document.createElement("button");
            updateButton.textContent = "Update";
            updateButton.classList.add("btn", "btn-update");
            updateButton.addEventListener("click", () => updateCartItem(token, cartItem.productId, quantityInput));
            updateCell.appendChild(updateButton);
            
            // Delete Button
            const deleteCell = document.createElement("td");
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.classList.add("btn", "btn-delete");
            deleteButton.addEventListener("click", () => deleteCartItem(token, cartItem.productId));
            deleteCell.appendChild(deleteButton);
            
            // Append all cells to the row
            row.append(
                descCell,
                countryCell,
                subTotalCell,
                unitPriceCell,
                quantityCell,
                updateCell,
                deleteCell
            );
            
            // Add row to table
            tbody.appendChild(row);
        });
    })
    .catch(error => {
        console.error("Error loading cart items:", error);
        const tbody = document.querySelector("#cart-items-tbody");
        tbody.innerHTML = `<tr><td colspan="7">Error loading cart items</td></tr>`;
    });
}

// Retrieve Cart Summary
function fetchCartSummary(token) {
    console.log('Fetching summary...');

    return fetch('/carts/summary', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(function (response) {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(function (body) {
        console.log('Received summary data:', body);

        if (!body.cartSummary) {
            throw new Error('Invalid cart summary data');
        }
        
        const cartSummaryDiv = document.querySelector("#cart-summary");
        if (!cartSummaryDiv) return;
        
        // Clear previous content
        cartSummaryDiv.innerHTML = '';
        
        // Create summary elements
        const totalQuantityEl = document.createElement('div');
        totalQuantityEl.innerHTML = `
            <span class="summary-label">Total Items:</span>
            <span class="summary-value">${body.cartSummary.totalQuantity || 0}</span>
        `;
        
        const totalPriceEl = document.createElement('div');
        totalPriceEl.innerHTML = `
            <span class="summary-label">Total Price:</span>
            <span class="summary-value">$${(body.cartSummary.totalPrice || 0).toFixed(2)}</span>
        `;
        
        // Append to container
        cartSummaryDiv.appendChild(totalQuantityEl);
        cartSummaryDiv.appendChild(totalPriceEl);
    })
    .catch(function (error) {
        console.error("Cart summary error:", error);
        const cartSummaryDiv = document.querySelector("#cart-summary");
        if (cartSummaryDiv) {
            cartSummaryDiv.innerHTML = 'Could not load cart summary';
        }
    });
}

function updateCartItem(token, productId, quantityInput) {
    const newQuantity = parseInt(quantityInput.value);
    if (isNaN(newQuantity) || newQuantity < 1) {
        alert("Please enter a valid quantity (minimum 1)");
        return;
    }

    fetch('/carts', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            productId: productId,
            quantity: newQuantity
        })
    })
    .then(response => {
        if (!response.ok) return response.json().then(err => { throw new Error(err.error) });
        return response.json();
    })
    .then(data => {
        alert('Quantity updated successfully');
        location.reload();
    })
    .catch(error => {
        console.error("Update error:", error);
        alert(error.message || "Failed to update quantity");
    });
}

function deleteCartItem(token, productId) {
    if (!confirm("Are you sure you want to remove this item?")) return;

    fetch('/carts', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId })
    })
    .then(response => {
        if (!response.ok) return response.json().then(err => { throw new Error(err.error) });
        return response.json();
    })
    .then(data => {
        alert('Item removed successfully');
        location.reload();
    })
    .catch(error => {
        console.error("Delete error:", error);
        alert(error.message || "Failed to remove item");
    });
}