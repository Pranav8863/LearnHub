const express = require('express');
const router = express.Router();
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getInstructorCourses,
} = require('../controllers/courseController');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/authMiddleware');

router.get('/instructor/my-courses', authenticateToken, requireRole('instructor', 'admin'), getInstructorCourses);
router.get('/', optionalAuth, getCourses);
router.get('/:idOrSlug', optionalAuth, getCourse);
router.post('/', authenticateToken, requireRole('instructor', 'admin'), createCourse);
router.patch('/:id', authenticateToken, requireRole('instructor', 'admin'), updateCourse);
router.delete('/:id', authenticateToken, requireRole('instructor', 'admin'), deleteCourse);

module.exports = router;
