const { query } = require('../database');
const { EMPTY_RESULT_ERROR, SQL_ERROR_CODE, UNIQUE_VIOLATION_ERROR } = require('../errors');

module.exports.retrieveAll = function retrieveAll(memberId) {
    let params = [];
    let sql = `SELECT * FROM sale_order_item s JOIN sale_order o ON s.sale_order_id=o.id JOIN product p ON s.product_id=p.id JOIN member m ON o.member_id=m.id`;
    if (memberId) {
        sql += ` WHERE o.member_id = $1`
        params.push(memberId);
    }
    return query(sql, params).then(function (result) {
        const rows = result.rows;

        if (rows.length === 0) {
            throw new EMPTY_RESULT_ERROR(`Sale Order not found!`);
        }

        return rows;
    });
};

// module.exports.retrieveSummary = function retrieveSummary(filters = {}) {
//   const {
//     memberId = null,
//     gender = null,
//     productType = null,
//     ageGroup = null,
//     startDate = null,
//     endDate = null,
//     sortBy = 'total_spent',
//     sortOrder = 'DESC'
//   } = filters;

//   // Validate sortBy and sortOrder values for safety
//   const allowedSortBy = ['total_spent', 'total_orders', 'average_order_value', 'latest_order'];
//   const allowedSortOrder = ['ASC', 'DESC'];

//   const orderBy = allowedSortBy.includes(sortBy) ? sortBy : 'total_spent';
//   const orderDir = allowedSortOrder.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

//   let params = [];
//   let whereClauses = [];
//   let paramIndex = 1;

//   // Member filtering (gender, ageGroup, memberId)
//   if (memberId) {
//     whereClauses.push(`m.id = $${paramIndex++}`);
//     params.push(memberId);
//   }
//   if (gender) {
//     whereClauses.push(`m.gender = $${paramIndex++}`);
//     params.push(gender);
//   }
//   if (startDate) {
//     whereClauses.push(`o.order_datetime >= $${paramIndex++}`);
//     params.push(startDate);
//   }
//   if (endDate) {
//     whereClauses.push(`o.order_datetime <= $${paramIndex++}`);
//     params.push(endDate);
//   }
//   if (productType) {
//     whereClauses.push(`p.product_type = $${paramIndex++}`);
//     params.push(productType);
//   }

//   // For ageGroup, we calculate age groups dynamically in SQL, so use a HAVING clause later.

//   const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

//   // Main query
//   // Calculate age group in SQL, aggregate per member
//   const sql = `
//     SELECT
//       m.id AS member_id,
//       m.username,
//       m.gender,
//       CASE
//         WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, m.dob)) BETWEEN 20 AND 29 THEN '20-29'
//         WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, m.dob)) BETWEEN 30 AND 39 THEN '30-39'
//         WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, m.dob)) >= 40 THEN '40+'
//         ELSE 'Under 20'
//       END AS age_group,
//       COALESCE(SUM(soi.quantity * p.unit_price), 0) AS total_spent,
//       COUNT(DISTINCT o.id) AS total_orders,
//       CASE WHEN COUNT(DISTINCT o.id) > 0 THEN ROUND(SUM(soi.quantity * p.unit_price) / COUNT(DISTINCT o.id), 2) ELSE 0 END AS average_order_value,
//       MAX(o.order_datetime) AS latest_order
//     FROM sale_order_item soi
//     JOIN sale_order o ON soi.sale_order_id = o.id
//     JOIN product p ON soi.product_id = p.id
//     JOIN member m ON o.member_id = m.id
//     ${whereSQL}
//     GROUP BY m.id, m.username, m.gender, m.dob
//     ${ageGroup ? `HAVING
//       CASE
//         WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, m.dob)) BETWEEN 20 AND 29 THEN '20-29'
//         WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, m.dob)) BETWEEN 30 AND 39 THEN '30-39'
//         WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, m.dob)) >= 40 THEN '40+'
//         ELSE 'Under 20'
//       END = $${paramIndex++}`
//     : ''}
//     ORDER BY ${orderBy} ${orderDir};
//   `;

//   if (ageGroup) {
//     params.push(ageGroup);
//   }

//   return query(sql, params).then(result => {
//     if (result.rows.length === 0) {
//       throw new EMPTY_RESULT_ERROR('No sales summary data found.');
//     }
//     return result.rows;
//   });
// };

// Admin Dashboard - Spending By Age and Gender
module.exports.getSpendingByAgeGender = () => {
  const sql = `
    SELECT
      gender,
      CASE
        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, dob)) BETWEEN 20 AND 29 THEN '20-29'
        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, dob)) BETWEEN 30 AND 39 THEN '30-39'
        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, dob)) >= 40 THEN '40+'
        ELSE 'Under 20'
      END AS age_group,
      COUNT(DISTINCT m.id) AS member_count,
      COALESCE(SUM(soi.quantity * p.unit_price), 0) AS total_spent,
      ROUND(COALESCE(AVG(soi.quantity * p.unit_price), 0), 2) AS avg_spent_per_order
    FROM member m
    LEFT JOIN sale_order so ON so.member_id = m.id AND so.status = 'COMPLETED'
    LEFT JOIN sale_order_item soi ON soi.sale_order_id = so.id
    LEFT JOIN product p ON p.id = soi.product_id
    GROUP BY gender, age_group
    ORDER BY gender, age_group;
  `;
  return query(sql).then(result => result.rows);
};

// Admin Dashboard - Latest Spending Per Member
module.exports.getLatestSpendingPerMember = () => {
  const sql = `
    SELECT
      m.id AS member_id,
      m.username,
      so.order_datetime AS latest_order_date,
      SUM(soi.quantity * p.unit_price) AS latest_order_spent
    FROM member m
    JOIN sale_order so ON so.member_id = m.id AND so.status = 'COMPLETED'
    JOIN sale_order_item soi ON soi.sale_order_id = so.id
    JOIN product p ON p.id = soi.product_id
    WHERE so.order_datetime = (
      SELECT MAX(order_datetime)
      FROM sale_order so2
      WHERE so2.member_id = m.id AND so2.status = 'COMPLETED'
    )
    GROUP BY m.id, m.username, so.order_datetime
    ORDER BY so.order_datetime DESC;
  `;
  return query(sql).then(result => result.rows);
};

// Admin Dashboard - Order by Spending
module.exports.getTopSpenders = (limit = 10) => {
  const sql = `
    SELECT
      m.id AS member_id,
      m.username,
      SUM(soi.quantity * p.unit_price) AS total_spent
    FROM member m
    JOIN sale_order so ON so.member_id = m.id AND so.status = 'COMPLETED'
    JOIN sale_order_item soi ON soi.sale_order_id = so.id
    JOIN product p ON p.id = soi.product_id
    GROUP BY m.id, m.username
    ORDER BY total_spent DESC
    LIMIT $1;
  `;
  return query(sql, [limit]).then(result => result.rows);
};

// Admin Dashboard - Min/Max Spending Per Member
module.exports.getMinMaxSpendingPerMember = () => {
  const sql = `
    SELECT
      m.id AS member_id,
      m.username,
      MIN(order_totals.total) AS min_order_spent,
      MAX(order_totals.total) AS max_order_spent
    FROM member m
    JOIN (
      SELECT
        so.member_id,
        so.id AS order_id,
        SUM(soi.quantity * p.unit_price) AS total
      FROM sale_order so
      JOIN sale_order_item soi ON soi.sale_order_id = so.id
      JOIN product p ON p.id = soi.product_id
      WHERE so.status = 'COMPLETED'
      GROUP BY so.member_id, so.id
    ) AS order_totals ON order_totals.member_id = m.id
    GROUP BY m.id, m.username
    ORDER BY m.id;
  `;
  return query(sql).then(result => result.rows);
};

// Admin Dashboard - Filter Spending By Age and Gender
module.exports.getSpendingByAgeGenderFiltered = async (gender, ageGroup, status) => {
  const values = [];
  let i = 1;

  let sql = `
    SELECT
      gender,
      CASE
        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, dob)) BETWEEN 20 AND 29 THEN '20-29'
        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, dob)) BETWEEN 30 AND 39 THEN '30-39'
        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, dob)) >= 40 THEN '40+'
        ELSE 'Under 20'
      END AS age_group,
      COUNT(DISTINCT m.id) AS member_count,
      COALESCE(SUM(soi.quantity * p.unit_price), 0) AS total_spent,
      ROUND(COALESCE(AVG(soi.quantity * p.unit_price), 0), 2) AS avg_spent_per_order
    FROM member m
    LEFT JOIN sale_order so ON so.member_id = m.id
    LEFT JOIN sale_order_item soi ON soi.sale_order_id = so.id
    LEFT JOIN product p ON p.id = soi.product_id
    WHERE 1=1
  `;

  if (gender) {
    sql += ` AND gender = $${i++}`;
    values.push(gender);
  }

  if (ageGroup) {
    sql += ` AND CASE
               WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, dob)) BETWEEN 20 AND 29 THEN '20-29'
               WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, dob)) BETWEEN 30 AND 39 THEN '30-39'
               WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, dob)) >= 40 THEN '40+'
               ELSE 'Under 20'
             END = $${i++}`;
    values.push(ageGroup);
  }

  if (status) {
    sql += ` AND so.status = $${i++}`;
    values.push(status);
  }

  sql += `
    GROUP BY gender, age_group
    ORDER BY gender, age_group;
  `;

  const { rows } = await query(sql, values);
  return rows.map(row => ({
    gender: row.gender,
    ageGroup: row.ageGroup,
    memberCount: parseInt(row.memberCount),
    totalSpent: parseFloat(row.totalSpent),
    avgSpentPerOrder: parseFloat(row.avgSpentPerOrder)
  }));
};