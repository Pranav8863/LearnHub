const express = require('express');
const router = express.Router();
const {
  createOrUpdateReview,
  getCourseReviews,
  deleteReview,
} = require('../controllers/reviewController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/courses/:courseId/reviews', getCourseReviews);
router.post('/courses/:courseId/reviews', authenticateToken, createOrUpdateReview);
router.delete('/:id', authenticateToken, deleteReview);

module.exports = router;
