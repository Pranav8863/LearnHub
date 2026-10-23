const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getAdminReports,
  getAllEnrollments,
  getInstructorAnalytics,
} = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.get('/instructor-analytics', authenticateToken, requireRole('instructor', 'admin'), getInstructorAnalytics);
router.get('/dashboard', authenticateToken, requireRole('admin'), getAdminDashboard);
router.get('/reports', authenticateToken, requireRole('admin'), getAdminReports);
router.get('/enrollments', authenticateToken, requireRole('admin'), getAllEnrollments);

module.exports = router;
