const { query } = require('../database');
const { EMPTY_RESULT_ERROR, SQL_ERROR_CODE, UNIQUE_VIOLATION_ERROR } = require('../errors');

// Create Review
module.exports.createReview = async (member_id, product_id, review_text, rating) => {
    try {
        const SQL = `CALL create_review($1, $2, $3, $4);`;
        const values = [member_id, product_id, review_text, rating];
        await query(SQL, values);
        return { message: 'Procedure executed' };
    } catch (err) {
        console.error('Error calling create_review procedure:', err);
        throw err;
    }
};

// Check if member can review
module.exports.canMemberReview = async (member_id, product_id) => {
    const sql = `
      SELECT 1 AS valid
      FROM sale_order so
      JOIN sale_order_item soi ON so.id = soi.sale_order_id
      WHERE so.member_id = $1
        AND soi.product_id = $2
        AND so.status = 'COMPLETED'
      LIMIT 1;
    `;
    const result = await query(sql, [member_id, product_id]);
    
    // Debug console.log
    console.log("canMemberReview SQL result:", result);
    console.log("rowCount:", result.rowCount);
    // result.rowCount > 0 returns true if row(s) found, else false
    return result.rowCount > 0;
};

// Get Review By A Product
module.exports.getReviewsByProduct = async function (productId) {
    try {
        const result = await query(
            'SELECT * FROM get_reviews_by_product($1);',
            [productId]
        );
        return result.rows;
    } catch (error) {
        throw error;
    }
};

// Get All Reviews
module.exports.getReviews = async (member_id) => {
    const SQL = `
        SELECT
            r.id AS id,
            r.review_text,
            r.rating,
            r.updated_at AS "lastUpdatedDate",
            p.id AS product_id,
            p.name AS product_name
        FROM review r
        JOIN product p ON r.product_id = p.id
        WHERE r.member_id = $1
        ORDER BY r.updated_at DESC;
    `;

    const result = await query(SQL, [member_id]);
    return result.rows;
};

// Update Review
module.exports.updateReview = async (member_id, review_id, review_text, rating) => {
    const SQL = `
        UPDATE review
        SET review_text = $1,
            rating = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3 AND member_id = $4;
    `;
    const values = [review_text, rating, review_id, member_id];
    const result = await query(SQL, values);

    // Debug console.log
    console.log("Update result rowCount:", result.rowCount)

    if (result.rowCount === 0) {
        throw new Error("No matching review found or you do not have permission.");
    }
};

// Delete Review
module.exports.deleteReview = async (member_id, review_id) => {
    const SQL = `
        DELETE FROM review
        WHERE id = $1 AND member_id = $2;
    `;
    const values = [review_id, member_id];
    await query(SQL, values);
};

