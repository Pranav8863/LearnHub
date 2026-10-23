const express = require('express');
const router = express.Router();
const {
  enrollInCourse,
  getMyEnrolledCourses,
  getCourseProgress,
  updateLessonProgress,
} = require('../controllers/enrollmentController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/courses/:courseId/enroll', authenticateToken, enrollInCourse);
router.get('/my-courses', authenticateToken, getMyEnrolledCourses);
router.get('/enrollments/my-courses', authenticateToken, getMyEnrolledCourses);
router.get('/courses/:courseId/progress', authenticateToken, getCourseProgress);
router.patch('/courses/:courseId/lessons/:lessonId/progress', authenticateToken, updateLessonProgress);

module.exports = router;
