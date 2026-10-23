const Course = require('../models/Course');
const Section = require('../models/Section');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');

// Helper to check if user can manage the course
const canManageCourse = async (courseId, user) => {
  if (user.role === 'admin') return true;
  const course = await Course.findById(courseId);
  if (!course) return false;
  return course.instructor.toString() === user._id.toString();
};

// Recalculate total duration and total lessons for a course
const recalculateCourseStats = async (courseId) => {
  const lessons = await Lesson.find({ course: courseId });
  const totalLessons = lessons.length;
  const totalDuration = lessons.reduce((acc, l) => acc + (l.duration || 0), 0);

  await Course.findByIdAndUpdate(courseId, {
    totalLessons,
    totalDuration,
  });
};

// @desc Get all sections and lessons for a course
// @route GET /api/courses/:courseId/lessons
// @access Private (Enrolled Student, Owner Instructor, or Admin)
const getCourseLessons = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const isOwner = course.instructor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const enrollment = await Enrollment.findOne({ student: req.user._id, course: courseId });

    if (!isOwner && !isAdmin && !enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled in this course to access lessons.',
      });
    }

    const sections = await Section.find({ course: courseId }).sort({ order: 1 });
    const lessons = await Lesson.find({ course: courseId }).sort({ order: 1 });

    const curriculum = sections.map((sec) => ({
      _id: sec._id,
      title: sec.title,
      order: sec.order,
      notes: sec.notes || '',
      practiceQuestions: sec.practiceQuestions || [],
      lessons: lessons.filter((l) => l.section.toString() === sec._id.toString()),
    }));

    return res.status(200).json({
      success: true,
      course: {
        _id: course._id,
        title: course.title,
        slug: course.slug,
      },
      sections,
      lessons,
      curriculum,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Create a new section
// @route POST /api/courses/:courseId/sections
// @access Private (Instructor/Admin)
const createSection = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { title, order, notes, practiceQuestions } = req.body;

    const allowed = await canManageCourse(courseId, req.user);
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Forbidden: Cannot manage this course' });
    }

    const lastSection = await Section.findOne({ course: courseId }).sort({ order: -1 });
    const sectionOrder = order !== undefined ? order : (lastSection ? lastSection.order + 1 : 1);

    const section = await Section.create({
      course: courseId,
      title: title ? title.trim() : 'New Section',
      notes: notes || '',
      practiceQuestions: Array.isArray(practiceQuestions) ? practiceQuestions : [],
      order: sectionOrder,
    });

    return res.status(201).json({
      success: true,
      message: 'Section created successfully',
      section,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update section
// @route PATCH /api/sections/:id
// @access Private (Instructor/Admin)
const updateSection = async (req, res, next) => {
  try {
    const section = await Section.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }

    const allowed = await canManageCourse(section.course, req.user);
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { title, order, notes, practiceQuestions } = req.body;
    if (title) section.title = title.trim();
    if (order !== undefined) section.order = order;
    if (notes !== undefined) section.notes = notes;
    if (practiceQuestions !== undefined) section.practiceQuestions = practiceQuestions;

    await section.save();

    return res.status(200).json({
      success: true,
      message: 'Section updated successfully',
      section,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete section
// @route DELETE /api/sections/:id
// @access Private (Instructor/Admin)
const deleteSection = async (req, res, next) => {
  try {
    const section = await Section.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }

    const allowed = await canManageCourse(section.course, req.user);
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // Delete all lessons in this section
    await Lesson.deleteMany({ section: section._id });
    await Section.findByIdAndDelete(section._id);

    await recalculateCourseStats(section.course);

    return res.status(200).json({
      success: true,
      message: 'Section and its lessons deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc Create lesson in a course
// @route POST /api/courses/:courseId/lessons
// @access Private (Instructor/Admin)
const createLesson = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { sectionId, title, description, notes, videoUrl, duration, order, resources, isFreePreview } = req.body;

    const allowed = await canManageCourse(courseId, req.user);
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Forbidden: Cannot manage this course' });
    }

    if (!title || !sectionId) {
      return res.status(400).json({ success: false, message: 'Lesson title and sectionId are required' });
    }

    const lastLesson = await Lesson.findOne({ section: sectionId }).sort({ order: -1 });
    const lessonOrder = order !== undefined ? order : (lastLesson ? lastLesson.order + 1 : 1);

    const lesson = await Lesson.create({
      course: courseId,
      section: sectionId,
      title: title.trim(),
      description: description || '',
      notes: notes || '',
      videoUrl: videoUrl || '',
      duration: duration !== undefined ? Number(duration) : 5,
      order: lessonOrder,
      resources: Array.isArray(resources) ? resources : [],
      isFreePreview: Boolean(isFreePreview),
    });

    await recalculateCourseStats(courseId);

    return res.status(201).json({
      success: true,
      message: 'Lesson created successfully',
      lesson,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update lesson
// @route PATCH /api/lessons/:id
// @access Private (Instructor/Admin)
const updateLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    const allowed = await canManageCourse(lesson.course, req.user);
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const {
      title,
      description,
      notes,
      videoUrl,
      duration,
      order,
      resources,
      isFreePreview,
      sectionId,
    } = req.body;

    if (title) lesson.title = title.trim();
    if (description !== undefined) lesson.description = description;
    if (notes !== undefined) lesson.notes = notes;
    if (videoUrl !== undefined) lesson.videoUrl = videoUrl;
    if (duration !== undefined) lesson.duration = Number(duration);
    if (order !== undefined) lesson.order = Number(order);
    if (resources !== undefined) lesson.resources = resources;
    if (isFreePreview !== undefined) lesson.isFreePreview = Boolean(isFreePreview);
    if (sectionId && sectionId !== lesson.section.toString()) lesson.section = sectionId;

    await lesson.save();
    await recalculateCourseStats(lesson.course);

    return res.status(200).json({
      success: true,
      message: 'Lesson updated successfully',
      lesson,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete lesson
// @route DELETE /api/lessons/:id
// @access Private (Instructor/Admin)
const deleteLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    const allowed = await canManageCourse(lesson.course, req.user);
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const courseId = lesson.course;
    await Lesson.findByIdAndDelete(lesson._id);
    await recalculateCourseStats(courseId);

    return res.status(200).json({
      success: true,
      message: 'Lesson deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCourseLessons,
  createSection,
  updateSection,
  deleteSection,
  createLesson,
  updateLesson,
  deleteLesson,
};
