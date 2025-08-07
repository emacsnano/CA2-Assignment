// See https://expressjs.com/en/guide/routing.html for routing

const express = require('express');
const reviewsController = require('../controllers/reviewsController');
const jwtMiddleware = require('../middleware/jwtMiddleware');

const router = express.Router();

// All routes in this file will use the jwtMiddleware to verify the token
// Here the jwtMiddleware is applied at the router level to apply to all routes in this file eg. router.use(...)

router.use(jwtMiddleware.verifyToken);

// Create Review
router.post('/create/page', reviewsController.createReview);

// Get Reviews By Product
router.get('/', reviewsController.getReviewsByProduct);

// Get All Reviews
router.get('/retrieve/all/page', reviewsController.getAllReviews);

// Update Review
router.put('/update/page', reviewsController.updateReview);

// Delete Review
router.delete('/delete/page', reviewsController.deleteReview);


module.exports = router;