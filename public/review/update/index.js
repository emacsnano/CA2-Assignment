// you can modify the code 
// you will need to add code to handle the form submission

window.addEventListener('DOMContentLoaded', function () {

    const token = localStorage.getItem('token');
    const reviewId = localStorage.getItem('reviewId');

    if (!token || !reviewId) {
        alert("Missing token or review ID.");
        return;
    }

    const form = document.querySelector('form'); // Only have 1 form in this HTML
    // form.querySelector('input[name=reviewId]').value = reviewId;

    const reviewIdInput = form.querySelector('input[name=reviewId]');
    const ratingInput = form.querySelector('select[name=rating]');
    const reviewTextInput = form.querySelector('textarea[name=reviewText]');

    reviewIdInput.value = reviewId;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const updatedReview = {
            review_id: parseInt(reviewId),
            rating: parseInt(ratingInput.value),
            review_text: reviewTextInput.value
        };

        console.log("Rating value (raw):", ratingInput.value);
        console.log("Parsed rating:", parseInt(ratingInput.value));

        if (isNaN(updatedReview.rating) || !updatedReview.review_text.trim()) {
            alert("Please fill in all fields.");
        return;
        }

        fetch(`/reviews/update/page`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(updatedReview)
        })
            .then(response => response.json())
            .then(result => {
                if (result.error) throw new Error(result.error);
                alert("Review updated successfully!");
                localStorage.removeItem("reviewId");
                window.location.href = "/review/retrieve/all"; // Redirect back to all reviews
            })
            .catch(error => {
                console.error("Update failed:", error);
                alert("Failed to update review: " + error.message);
            });
    });
});

