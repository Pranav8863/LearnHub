const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.get('/', getCategories);
router.get('/:idOrSlug', getCategory);
router.post('/', authenticateToken, requireRole('admin'), createCategory);
router.patch('/:id', authenticateToken, requireRole('admin'), updateCategory);
router.delete('/:id', authenticateToken, requireRole('admin'), deleteCategory);

module.exports = router;
