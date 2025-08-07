// See https://expressjs.com/en/guide/routing.html for routing

const express = require('express');
const commentsController = require('../controllers/commentsController');
const jwtMiddleware = require('../middleware/jwtMiddleware');

const router = express.Router();

// All routes in this file will use the jwtMiddleware to verify the token
// Here the jwtMiddleware is applied at the router level to apply to all routes in this file eg. router.use(...)

router.use(jwtMiddleware.verifyToken);

// Create a new comment
router.post('/', commentsController.createComment);

// Get all comments for a specific review
router.get('/review', commentsController.getCommentsByProduct);

// Delete a comment (usually by comment id)
router.delete('/:comment_id', commentsController.deleteComment);

module.exports = router;