const Review = require('../models/Review');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// Helper to recalculate course rating
const recalculateCourseRating = async (courseId) => {
  const reviews = await Review.find({ course: courseId });
  const reviewCount = reviews.length;
  const averageRating = reviewCount > 0
    ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1))
    : 0;

  await Course.findByIdAndUpdate(courseId, {
    averageRating,
    reviewCount,
  });

  return { averageRating, reviewCount };
};

// @desc Add or update review for a course
// @route POST /api/courses/:courseId/reviews
// @access Private (Enrolled Student)
const createOrUpdateReview = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { rating, comment } = req.body;
    const studentId = req.user._id;

    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Rating (1-5) and comment are required.',
      });
    }

    // Verify enrollment
    const enrollment = await Enrollment.findOne({ student: studentId, course: courseId });
    if (!enrollment && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled in the course to leave a review.',
      });
    }

    // Check if review already exists
    let review = await Review.findOne({ student: studentId, course: courseId });

    if (review) {
      review.rating = Number(rating);
      review.comment = comment.trim();
      await review.save();
    } else {
      review = await Review.create({
        student: studentId,
        course: courseId,
        rating: Number(rating),
        comment: comment.trim(),
      });
    }

    // Recalculate course average rating
    const ratingStats = await recalculateCourseRating(courseId);

    const populatedReview = await Review.findById(review._id).populate('student', 'name avatar');

    return res.status(200).json({
      success: true,
      message: 'Review submitted successfully',
      review: populatedReview,
      ratingStats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get reviews for a course
// @route GET /api/courses/:courseId/reviews
// @access Public
const getCourseReviews = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const reviews = await Review.find({ course: courseId })
      .populate('student', 'name avatar')
      .sort({ createdAt: -1 });

    const total = reviews.length;
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;

    reviews.forEach((r) => {
      sum += r.rating;
      if (breakdown[r.rating] !== undefined) {
        breakdown[r.rating]++;
      }
    });

    const averageRating = total > 0 ? Number((sum / total).toFixed(1)) : 0;

    return res.status(200).json({
      success: true,
      total,
      averageRating,
      breakdown,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete a review
// @route DELETE /api/reviews/:id
// @access Private (Owner or Admin)
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const isOwner = review.student.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const courseId = review.course;
    await Review.findByIdAndDelete(review._id);
    await recalculateCourseRating(courseId);

    return res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrUpdateReview,
  getCourseReviews,
  deleteReview,
};
