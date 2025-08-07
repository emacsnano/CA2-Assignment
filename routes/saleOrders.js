const express = require('express');
const saleOrdersController = require('../controllers/saleOrdersController');
const jwtMiddleware = require('../middleware/jwtMiddleware');

const router = express.Router();

// All routes in this file will use the jwtMiddleware to verify the token
// Here the jwtMiddleware is applied at the router level to apply to all routes in this file eg. router.use(...)

router.use(jwtMiddleware.verifyToken);

router.get('/', saleOrdersController.retrieveAll);
router.get('/dashboard/spendingByAgeGender', saleOrdersController.spendingByAgeGender);
router.get('/dashboard/latestSpendingPerMember', saleOrdersController.latestSpendingPerMember);
router.get('/dashboard/topSpenders', saleOrdersController.topSpenders);
router.get('/dashboard/minMaxSpendingPerMember', saleOrdersController.minMaxSpendingPerMember);
router.get('/dashboard/spendingByAgeGenderFiltered', saleOrdersController.spendingByAgeGenderFiltered);


module.exports = router;