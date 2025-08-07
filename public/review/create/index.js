// // you can modify the code 
// // you will need to add code to handle the form submission

window.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem("token"); // Retrieve JWT token from localStorage

    // Fetch the list of sale orders from the server
    fetch('/saleOrders', {
        headers: {
            Authorization: `Bearer ${token}` // Include JWT Token in the Authorization header
        }
    })
    .then(function (response) {
        return response.json(); // Parse the response body as JSON
    })
    .then(function (body) {
        if (body.error) throw new Error(body.error); // Handle any errors returned
        const saleOrders = body.saleOrders;
        const tbody = document.querySelector("#product-tbody");
        const form = document.querySelector("form");
        const reviewProductSpan = document.querySelector("#review-product-id");

        if (!saleOrders || saleOrders.length === 0) {
            // No past orders - disable the form and show a message
            if (form) {
                form.querySelectorAll("input, textarea, button").forEach(el => el.disabled = true);
            }
            reviewProductSpan.textContent = "You have no past orders to review.";
            return; // Exit early, no rows to show
        }

        saleOrders.forEach(function (saleOrder) {
            const row = document.createElement("tr");
            row.classList.add("product");

            // Create individual table cells for each sale order detail
            const nameCell = document.createElement("td");
            const descriptionCell = document.createElement("td");
            const unitPriceCell = document.createElement("td");
            const quantityCell = document.createElement("td");
            const countryCell = document.createElement("td");
            const imageUrlCell = document.createElement("td");
            const orderId = document.createElement("td");
            const orderDatetimeCell = document.createElement("td");
            const statusCell = document.createElement("td");
            const createReviewCell = document.createElement("td");

            nameCell.textContent = saleOrder.name;
            descriptionCell.textContent = saleOrder.description;
            unitPriceCell.textContent = saleOrder.unitPrice;
            quantityCell.textContent = saleOrder.quantity;
            countryCell.textContent = saleOrder.country;
            imageUrlCell.innerHTML = `<img src="${saleOrder.imageUrl}" alt="Product Image">`;
            orderId.textContent = saleOrder.saleOrderId;
            orderDatetimeCell.textContent = new Date(saleOrder.orderDatetime).toLocaleString();
            statusCell.textContent = saleOrder.status;

            // Create the "Create Review" button
            const viewProductButton = document.createElement("button");
            viewProductButton.textContent = "Create Review";

            // When the button is clicked, populate the review form
            viewProductButton.addEventListener('click', function () {
                reviewProductSpan.innerHTML = saleOrder.name;
                const productIdInput = document.querySelector("input[name='productId']");
                productIdInput.value = saleOrder.productId;
            });
            createReviewCell.appendChild(viewProductButton);

            // Append all cells to the row
            row.appendChild(nameCell);
            row.appendChild(descriptionCell);
            row.appendChild(imageUrlCell);
            row.appendChild(unitPriceCell);
            row.appendChild(quantityCell);
            row.appendChild(countryCell);
            row.appendChild(orderId);
            row.appendChild(orderDatetimeCell);
            row.appendChild(statusCell);
            row.appendChild(createReviewCell);
            tbody.appendChild(row);
        });
    })
    .catch(function (error) {
        console.error(error);
    });
});

// Create Review
window.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector("form");
    if (!form) {
        console.error("Form element not found!");
        return;
    }

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const token = localStorage.getItem("token");

        // Decode the JWT to extract member_id
        function parseJwt(token) {
            try {
                return JSON.parse(atob(token.split('.')[1]));
            } catch (e) {
                console.error("Failed to parse JWT:", e);
                return null;
            }
        }

        const decoded = parseJwt(token);
        const memberId = decoded?.member_id || decoded?.memberId;

        const productId = document.querySelector("#productId").value;
        const rating = document.querySelector("#rating").value;
        const reviewText = document.querySelector("#reviewText").value;

        if (!memberId || !productId || !rating || !reviewText) {
            alert("Please fill in all fields.");
            return;
        }

        fetch("/reviews/create/page", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                member_id: parseInt(memberId),
                product_id: parseInt(productId),
                rating: parseInt(rating),
                review_text: reviewText
            })
        })
        .then(response => response.json())
        .then(result => {
            if (result.error) throw new Error(result.error);
            alert("Review created successfully!");
            form.reset();
            document.querySelector("#review-product-id").innerHTML = "";
        })
        .catch(error => {
            console.error("Error creating review:", error);
            alert("Failed to create review: " + error.message);
        });
    });
});
