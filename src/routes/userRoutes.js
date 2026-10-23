const express = require('express');
const router = express.Router();
const {
  getMe,
  updateMe,
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
} = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.get('/me', authenticateToken, getMe);
router.patch('/me', authenticateToken, updateMe);

// Admin-only endpoints
router.get('/', authenticateToken, requireRole('admin'), getAllUsers);
router.patch('/:id/role', authenticateToken, requireRole('admin'), updateUserRole);
router.patch('/:id/status', authenticateToken, requireRole('admin'), toggleUserStatus);
router.delete('/:id', authenticateToken, requireRole('admin'), deleteUser);

module.exports = router;
