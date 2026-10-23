const User = require('../models/User');
const Course = require('../models/Course');
const Category = require('../models/Category');
const Enrollment = require('../models/Enrollment');
const Certificate = require('../models/Certificate');
const Review = require('../models/Review');

// @desc Get admin dashboard stats
// @route GET /api/admin/dashboard
// @access Private (Admin)
const getAdminDashboard = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalInstructors,
      totalAdmins,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      completedEnrollments,
      totalCertificates,
      totalReviews,
      recentUsers,
      recentEnrollments,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'instructor' }),
      User.countDocuments({ role: 'admin' }),
      Course.countDocuments(),
      Course.countDocuments({ isPublished: true }),
      Enrollment.countDocuments(),
      Enrollment.countDocuments({ status: 'completed' }),
      Certificate.countDocuments(),
      Review.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email role avatar createdAt'),
      Enrollment.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .populate('student', 'name email avatar')
        .populate('course', 'title thumbnail'),
    ]);

    const completionRate = totalEnrollments > 0
      ? Math.round((completedEnrollments / totalEnrollments) * 100)
      : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalStudents,
        totalInstructors,
        totalAdmins,
        totalCourses,
        publishedCourses,
        draftCourses: totalCourses - publishedCourses,
        totalEnrollments,
        completedEnrollments,
        completionRate,
        totalCertificates,
        totalReviews,
      },
      recentUsers,
      recentEnrollments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get analytics and charts reports
// @route GET /api/admin/reports
// @access Private (Admin)
const getAdminReports = async (req, res, next) => {
  try {
    // Top 5 popular courses
    const topCourses = await Course.find({ isPublished: true })
      .sort({ enrollmentCount: -1 })
      .limit(5)
      .select('title enrollmentCount averageRating reviewCount difficulty');

    // Category distribution
    const categories = await Category.find().select('name slug courseCount');

    // Monthly enrollments trend (last 6 months aggregation)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const enrollmentTrend = await Enrollment.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedTrend = enrollmentTrend.map((item) => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      enrollments: item.count,
      completions: item.completed,
    }));

    return res.status(200).json({
      success: true,
      topCourses,
      categories,
      enrollmentTrend: formattedTrend,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get all enrollments with pagination
// @route GET /api/admin/enrollments
// @access Private (Admin)
const getAllEnrollments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '15', 10);
    const skip = (page - 1) * limit;

    const [enrollments, total] = await Promise.all([
      Enrollment.find()
        .populate('student', 'name email avatar')
        .populate('course', 'title thumbnail difficulty category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Enrollment.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      enrollments,
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

// @desc Instructor analytics
// @route GET /api/admin/instructor-analytics
// @access Private (Instructor or Admin)
const getInstructorAnalytics = async (req, res, next) => {
  try {
    const instructorId = req.user._id;

    const courses = await Course.find({ instructor: instructorId });
    const courseIds = courses.map((c) => c._id);

    const [enrollmentsCount, completedEnrollmentsCount, certificatesCount] = await Promise.all([
      Enrollment.countDocuments({ course: { $in: courseIds } }),
      Enrollment.countDocuments({ course: { $in: courseIds }, status: 'completed' }),
      Certificate.countDocuments({ course: { $in: courseIds } }),
    ]);

    const totalStudents = enrollmentsCount;
    const avgRating = courses.length > 0
      ? Number((courses.reduce((acc, c) => acc + (c.averageRating || 0), 0) / courses.length).toFixed(1))
      : 0;

    const courseBreakdown = courses.map((c) => ({
      _id: c._id,
      title: c.title,
      isPublished: c.isPublished,
      enrollments: c.enrollmentCount,
      rating: c.averageRating,
      reviews: c.reviewCount,
    }));

    return res.status(200).json({
      success: true,
      overview: {
        totalCourses: courses.length,
        totalStudents,
        completedStudents: completedEnrollmentsCount,
        certificatesIssued: certificatesCount,
        averageRating: avgRating,
      },
      courses: courseBreakdown,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminDashboard,
  getAdminReports,
  getAllEnrollments,
  getInstructorAnalytics,
};
