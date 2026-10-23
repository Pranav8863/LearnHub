const express = require('express');
const router = express.Router();
const {
  getCourseLessons,
  createSection,
  updateSection,
  deleteSection,
  createLesson,
  updateLesson,
  deleteLesson,
} = require('../controllers/lessonController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Nested under courses
router.get('/courses/:courseId/lessons', authenticateToken, getCourseLessons);
router.post('/courses/:courseId/sections', authenticateToken, requireRole('instructor', 'admin'), createSection);
router.post('/courses/:courseId/lessons', authenticateToken, requireRole('instructor', 'admin'), createLesson);

// Standalone entity operations
router.patch('/sections/:id', authenticateToken, requireRole('instructor', 'admin'), updateSection);
router.delete('/sections/:id', authenticateToken, requireRole('instructor', 'admin'), deleteSection);

router.patch('/lessons/:id', authenticateToken, requireRole('instructor', 'admin'), updateLesson);
router.delete('/lessons/:id', authenticateToken, requireRole('instructor', 'admin'), deleteLesson);

module.exports = router;
