const { EMPTY_RESULT_ERROR, UNIQUE_VIOLATION_ERROR, DUPLICATE_TABLE_ERROR } = require('../errors');
const reviewsModel = require('../models/reviews');

// Create Review
module.exports.createReview = async (req, res) => {
    const { member_id, product_id, review_text, rating } = req.body;

    // Debug console.log
    console.log("Incoming review:", {
        member_id,
        product_id,
        review_text,
        rating
    });

    try {
        // Check if member actually bought the product
        const allowed = await reviewsModel.canMemberReview(member_id, product_id);

        // Debug console.log
        console.log(`Can member ${member_id} review product ${product_id}?`, allowed);
        if (!allowed) {
            return res.status(403).json({ error: "You cannot review a product you haven't purchased." });
        }

        // Proceed with creating review
        const result = await reviewsModel.createReview(member_id, product_id, review_text, rating);
        res.status(201).json({ message: 'Review created successfully', data: result });
    } catch (err) {
        console.error('Create review error:', err.message);
        res.status(400).json({ error: err.message });
    }
};

// Get Reviews By A Product
module.exports.getReviewsByProduct = async function (req, res) {
    const productId = req.query.productId;

    if (!productId) {
        return res.status(400).json({ error: 'Missing productId query parameter' });
    }

    try {
        const reviews = await reviewsModel.getReviewsByProduct(productId);
        res.json({ reviews });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get All Reviews
module.exports.getAllReviews = async (req, res) => {
    // Get member_id from decoded JWT payload in req.user, optional chaining used because req.user.member_id and req.user.memberId does not really work
    const member_id = req.user?.member_id || req.user?.memberId;

    if (!member_id) {
        return res.status(400).json({ error: 'Invalid member ID' });
    }

    try {
        const reviews = await reviewsModel.getReviews(member_id);

        if (!reviews || reviews.length === 0) {
            return res.status(404).json({ error: 'No reviews found.' });
        }

        res.status(200).json({ reviews });
    } catch (err) {
        console.error('Error fetching reviews:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};


// Update Review
module.exports.updateReview = async (req, res) => {
    // Optional chaining used
    const member_id = req.user?.member_id || req.user?.memberId;
    const { review_id, review_text, rating } = req.body;

    // Debug console.log
    console.log("member_id:", member_id);
    console.log("review_id:", review_id);
    console.log("review_text:", review_text);
    console.log("rating:", rating);

    try {
        await reviewsModel.updateReview(member_id, review_id, review_text, rating);
        res.status(200).json({ message: 'Review updated successfully' });
    } catch (err) {
        console.error('Update review error:', err.message);
        res.status(400).json({ error: err.message });
    }
};

// Delete Review
module.exports.deleteReview = async (req, res) => {
    const { review_id } = req.body;
    // Optional chaining
    const member_id = req.user?.member_id || req.user?.memberId;

    try {
        await reviewsModel.deleteReview(member_id, review_id);
        res.status(200).json({ message: 'Review deleted successfully' });
    } catch (err) {
        console.error('Delete review error:', err.message);
        res.status(400).json({ error: err.message });
    }
};

