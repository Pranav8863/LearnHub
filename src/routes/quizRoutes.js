const express = require('express');
const router = express.Router();
const {
  createQuiz,
  getCourseQuizzes,
  getQuizById,
  submitQuizAttempt,
  getQuizResults,
  getStudentQuizzes,
} = require('../controllers/quizController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Course-nested quiz endpoints
router.post('/courses/:courseId/quizzes', authenticateToken, requireRole('instructor', 'admin'), createQuiz);
router.get('/courses/:courseId/quizzes', authenticateToken, getCourseQuizzes);

// Quizzes general endpoints
router.get('/student/my-quizzes', authenticateToken, getStudentQuizzes);
router.get('/:id', authenticateToken, getQuizById);
router.post('/:id/attempts', authenticateToken, submitQuizAttempt);
router.get('/:id/results', authenticateToken, getQuizResults);

module.exports = router;
