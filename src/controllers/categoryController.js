const Category = require('../models/Category');
const Course = require('../models/Course');

// Generate slug from name
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

// @desc Get all categories
// @route GET /api/categories
// @access Public
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    return res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get category by slug or id
// @route GET /api/categories/:idOrSlug
// @access Public
const getCategory = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);

    const category = isObjectId
      ? await Category.findById(idOrSlug)
      : await Category.findOne({ slug: idOrSlug.toLowerCase() });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    return res.status(200).json({ success: true, category });
  } catch (error) {
    next(error);
  }
};

// @desc Create category
// @route POST /api/categories
// @access Private (Admin)
const createCategory = async (req, res, next) => {
  try {
    const { name, description, icon } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const slug = slugify(name);
    const existing = await Category.findOne({ slug });
    if (existing) {
      return res.status(409).json({ success: false, message: 'A category with this name/slug already exists' });
    }

    const category = await Category.create({
      name,
      slug,
      description: description || '',
      icon: icon || 'BookOpen',
    });

    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update category
// @route PATCH /api/categories/:id
// @access Private (Admin)
const updateCategory = async (req, res, next) => {
  try {
    const { name, description, icon } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (name && name !== category.name) {
      category.name = name;
      category.slug = slugify(name);
    }
    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;

    await category.save();

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete category
// @route DELETE /api/categories/:id
// @access Private (Admin)
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Check if courses are using this category
    const courseCount = await Course.countDocuments({ category: category._id });
    if (courseCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category because ${courseCount} course(s) are assigned to it. Reassign courses first.`,
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
