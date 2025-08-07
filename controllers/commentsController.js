const { EMPTY_RESULT_ERROR, UNIQUE_VIOLATION_ERROR, DUPLICATE_TABLE_ERROR } = require('../errors');
const commentsModel = require('../models/comments');

// Create Comment
module.exports.createComment = async function (req, res) {
    const memberId = req.user.memberId;
    const { review_id, comment_text } = req.body;

    if (!review_id || !comment_text) {
        return res.status(400).json({ error: "Missing review_id or comment_text" });
    }

    try {
        await commentsModel.createComment(review_id, memberId, comment_text);
        res.status(201).json({ message: 'Comment created successfully' });
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get comments by review id
module.exports.getCommentsByProduct = async function (req, res) {
    // Debug console.log
    console.log(' Controller reached: getCommentsByProduct');
    const productId = req.query.productId;
    // Debug console.log
    console.log('Received productId:', productId);

    if (!productId) {
        return res.status(400).json({ error: 'Missing productId query parameter' });
    }

    try {
        const comments = await commentsModel.getCommentsByProduct(productId);
        // Debug console.log
        console.log('Comments from DB:', comments);
        res.json({ comments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// Delete Comment
module.exports.deleteComment = async (req, res) => {
    const { comment_id } = req.body;
    const member_id = req.user.id;
    try {
        await commentsModel.deleteComment(comment_id, member_id);
        res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (err) {
        console.error('Delete comment error:', err.message);
        res.status(400).json({ error: err.message });
    }
};

