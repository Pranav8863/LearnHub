const Enrollment = require('../models/Enrollment');
const LessonProgress = require('../models/LessonProgress');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Certificate = require('../models/Certificate');

// Helper to calculate progress and update enrollment
const updateCourseProgress = async (studentId, courseId) => {
  const totalLessons = await Lesson.countDocuments({ course: courseId });
  const completedCount = await LessonProgress.countDocuments({
    student: studentId,
    course: courseId,
    isCompleted: true,
  });

  const progressPercentage = totalLessons > 0
    ? Math.round((completedCount / totalLessons) * 100)
    : 0;

  const isCompleted = progressPercentage === 100 && totalLessons > 0;

  const enrollment = await Enrollment.findOneAndUpdate(
    { student: studentId, course: courseId },
    {
      progressPercentage,
      completedLessonsCount: completedCount,
      status: isCompleted ? 'completed' : 'active',
      ...(isCompleted && { completedAt: new Date() }),
    },
    { new: true }
  );

  return { enrollment, progressPercentage, completedCount, totalLessons, isCompleted };
};

// @desc Enroll in a course
// @route POST /api/courses/:courseId/enroll
// @access Private (Student)
const enrollInCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (!course.isPublished) {
      return res.status(400).json({ success: false, message: 'Cannot enroll in an unpublished course' });
    }

    // Check if already enrolled
    const existing = await Enrollment.findOne({ student: studentId, course: courseId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course.',
        enrollment: existing,
      });
    }

    // Find the first lesson to set as lastAccessedLesson
    const firstLesson = await Lesson.findOne({ course: courseId }).sort({ order: 1 });

    const enrollment = await Enrollment.create({
      student: studentId,
      course: courseId,
      status: 'active',
      progressPercentage: 0,
      completedLessonsCount: 0,
      lastAccessedLesson: firstLesson ? firstLesson._id : null,
    });

    // Increment course enrollmentCount
    await Course.findByIdAndUpdate(courseId, { $inc: { enrollmentCount: 1 } });

    return res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course!',
      enrollment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get student's enrolled courses
// @route GET /api/enrollments/my-courses
// @access Private (Student)
const getMyEnrolledCourses = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { student: req.user._id };
    if (status && ['active', 'completed'].includes(status)) {
      query.status = status;
    }

    const enrollments = await Enrollment.find(query)
      .populate({
        path: 'course',
        select: 'title slug subtitle thumbnail difficulty totalDuration totalLessons instructor category averageRating reviewCount',
        populate: [
          { path: 'instructor', select: 'name avatar title' },
          { path: 'category', select: 'name slug icon' },
        ],
      })
      .populate('lastAccessedLesson', 'title order duration')
      .sort({ updatedAt: -1 });

    // Filter out any enrollments whose course may have been removed
    const validEnrollments = enrollments.filter((e) => e.course != null);

    return res.status(200).json({
      success: true,
      count: validEnrollments.length,
      enrollments: validEnrollments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get course progress for current user
// @route GET /api/courses/:courseId/progress
// @access Private (Student)
const getCourseProgress = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;

    const enrollment = await Enrollment.findOne({ student: studentId, course: courseId });
    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this course.',
      });
    }

    const progressRecords = await LessonProgress.find({
      student: studentId,
      course: courseId,
      isCompleted: true,
    }).select('lesson completedAt');

    const completedLessonIds = progressRecords.map((p) => p.lesson.toString());

    // Check certificate eligibility
    const certificate = await Certificate.findOne({ student: studentId, course: courseId });

    return res.status(200).json({
      success: true,
      enrollment,
      completedLessonIds,
      progressPercentage: enrollment.progressPercentage,
      isCompleted: enrollment.status === 'completed',
      certificate: certificate ? certificate.toPublicView() : null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update lesson progress (mark complete / uncomplete)
// @route PATCH /api/courses/:courseId/lessons/:lessonId/progress
// @access Private (Student)
const updateLessonProgress = async (req, res, next) => {
  try {
    const { courseId, lessonId } = req.params;
    const { isCompleted = true } = req.body;
    const studentId = req.user._id;

    // Verify enrollment
    const enrollment = await Enrollment.findOne({ student: studentId, course: courseId });
    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled to update lesson progress.',
      });
    }

    // Verify lesson belongs to course
    const lesson = await Lesson.findOne({ _id: lessonId, course: courseId });
    if (!lesson) {
      return res.status(400).json({
        success: false,
        message: 'Lesson does not belong to this course.',
      });
    }

    // Update or create lesson progress
    const progress = await LessonProgress.findOneAndUpdate(
      { student: studentId, lesson: lessonId },
      {
        student: studentId,
        course: courseId,
        lesson: lessonId,
        isCompleted: Boolean(isCompleted),
        completedAt: Boolean(isCompleted) ? new Date() : null,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Update last accessed lesson
    await Enrollment.findOneAndUpdate(
      { student: studentId, course: courseId },
      { lastAccessedLesson: lessonId }
    );

    // Recalculate progress
    const updatedStats = await updateCourseProgress(studentId, courseId);

    return res.status(200).json({
      success: true,
      message: Boolean(isCompleted) ? 'Lesson marked as complete' : 'Lesson marked as incomplete',
      progress,
      ...updatedStats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  enrollInCourse,
  getMyEnrolledCourses,
  getCourseProgress,
  updateLessonProgress,
};
