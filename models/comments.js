const { query } = require('../database');
const { EMPTY_RESULT_ERROR, SQL_ERROR_CODE, UNIQUE_VIOLATION_ERROR } = require('../errors');

// Create Comment
module.exports.createComment = async function (reviewId, memberId, commentText) {
    try {
        await query(
            'SELECT create_comment($1, $2, $3);',
            [reviewId, memberId, commentText]
        );
    } catch (error) {
        throw error;
    }
};

// Get comments by review id
module.exports.getCommentsByProduct = async function (productId) {
    try {
        const result = await query(
            'SELECT * FROM get_comments_by_product($1);',
            [productId]
        );
        // Debug console.log
        console.log('DB result rows:', result.rows);
        return result.rows;
    } catch (error) {
        console.error('DB error:', error);
        throw error;
    }
};

// Delete Comment
module.exports.deleteComment = async (comment_id, member_id) => {
    try {
        await query(`CALL delete_comment($1, $2);`, [comment_id, member_id]);
    } catch (err) {
        throw err;
    }
};