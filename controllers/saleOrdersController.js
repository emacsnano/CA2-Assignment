const { EMPTY_RESULT_ERROR, UNIQUE_VIOLATION_ERROR, DUPLICATE_TABLE_ERROR } = require('../errors');
const saleOrdersModel = require('../models/saleOrders');
const membersModel = require('../models/members');

// Debug console.log
console.log('DEBUG saleOrdersModel:', saleOrdersModel);

module.exports.retrieveAll = function (req, res) {
    let memberId = req.user.memberId;

    membersModel
        .isAdmin(memberId)
        .then(function (isAdmin) {
            if (isAdmin) {
                memberId = null;
            }

            return saleOrdersModel.retrieveAll(memberId);
        })
        .then(function (saleOrders) {
            return res.json({ saleOrders: saleOrders });
        })
        .catch(function (error) {
            console.error(error);
            if (error instanceof EMPTY_RESULT_ERROR) {
                return res.status(404).json({ error: error.message });
            }
            return res.status(500).json({ error: error.message });
        });

}

// Admin Dashboard - Spending By Age and Gender
module.exports.spendingByAgeGender = (req, res) => {
  saleOrdersModel.getSpendingByAgeGender()
    .then(data => res.json(data))
    .catch(err => res.status(500).json({ error: err.message }));
};

// Admin Dashboard - Latest Spending Per Member
module.exports.latestSpendingPerMember = (req, res) => {
  saleOrdersModel.getLatestSpendingPerMember()
    .then(data => res.json(data))
    .catch(err => res.status(500).json({ error: err.message }));
};

// Admin Dashboard - Order by Spending
module.exports.topSpenders = (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  saleOrdersModel.getTopSpenders(limit)
    .then(data => res.json(data))
    .catch(err => res.status(500).json({ error: err.message }));
};

// Admin Dashboard - Min/Max Spending Per Member
module.exports.minMaxSpendingPerMember = (req, res) => {
  saleOrdersModel.getMinMaxSpendingPerMember()
    .then(data => res.json(data))
    .catch(err => res.status(500).json({ error: err.message }));
};

// Admin Dashboard - Filter Spending By Age and Gender
module.exports.spendingByAgeGenderFiltered = async (req, res) => {
  try {
    const { gender, age_group, status } = req.query;
    const data = await saleOrdersModel.getSpendingByAgeGenderFiltered(gender, age_group, status);
    if (!data.length) {
      return res.status(404).json({ message: 'No data found' });
    }
    res.json({ spendingByAgeGender: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};