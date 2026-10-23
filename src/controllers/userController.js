const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

// @desc Get current user
// @route GET /api/users/me
// @access Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    return res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc Update current user profile
// @route PATCH /api/users/me
// @access Private
const updateMe = async (req, res, next) => {
  try {
    const { name, title, bio, avatar, website, socialLinks } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name.trim();
    if (title !== undefined) user.title = title.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (avatar !== undefined) user.avatar = avatar.trim();
    if (website !== undefined) user.website = website.trim();
    if (socialLinks) {
      user.socialLinks = { ...user.socialLinks, ...socialLinks };
    }

    await user.save();
    return res.status(200).json({ success: true, message: 'Profile updated', user });
  } catch (error) {
    next(error);
  }
};

// @desc Get all users (Admin only)
// @route GET /api/users
// @access Private (Admin)
const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const skip = (page - 1) * limit;
    const { search, role, status } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (role && ['student', 'instructor', 'admin'].includes(role)) {
      query.role = role;
    }

    if (status) {
      query.isActive = status === 'active';
    }

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update user role (Admin only)
// @route PATCH /api/users/:id/role
// @access Private (Admin)
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['student', 'instructor', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified',
      });
    }

    if (req.user._id.toString() === req.params.id && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot demote your own admin account',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Toggle user active status (Admin only)
// @route PATCH /api/users/:id/status
// @access Private (Admin)
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User status changed to ${user.isActive ? 'Active' : 'Inactive'}`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete user (Admin only)
// @route DELETE /api/users/:id
// @access Private (Admin)
const deleteUser = async (req, res, next) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own admin account',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if user is instructor with published courses
    if (user.role === 'instructor') {
      const coursesCount = await Course.countDocuments({ instructor: user._id });
      if (coursesCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete instructor with ${coursesCount} courses. Please reassign or delete their courses first.`,
        });
      }
    }

    await User.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMe,
  updateMe,
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
};
