// you can modify the code 
// you will need to add code to handle the form submission

window.addEventListener('DOMContentLoaded', function () {

    const token = localStorage.getItem('token');
    const reviewId = localStorage.getItem('reviewId');

    if (!token || !reviewId) {
        alert("Missing token or review ID.");
        return;
    }

    const form = document.querySelector('form');
    const reviewIdInput = form.querySelector('input[name=reviewId]');
    reviewIdInput.value = reviewId;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const confirmDelete = confirm("Are you sure you want to delete this review?");
        if (!confirmDelete) return;

        fetch('/reviews/delete/page', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ review_id: parseInt(reviewId) })
        })
            .then(response => response.json())
            .then(result => {
                if (result.error) throw new Error(result.error);
                alert("Review deleted successfully!");
                localStorage.removeItem("reviewId");
                window.location.href = "/review/retrieve/all"; // Redirect back to all reviews
            })
            .catch(error => {
                console.error("Delete failed:", error);
                alert("Failed to delete review: " + error.message);
            });
    });
});

