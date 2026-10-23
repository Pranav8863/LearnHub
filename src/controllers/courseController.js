const Course = require('../models/Course');
const Section = require('../models/Section');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const Category = require('../models/Category');

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-') + '-' + Math.random().toString(36).substring(2, 7);
};

// @desc Get public courses with filters and pagination
// @route GET /api/courses
// @access Public
const getCourses = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '9', 10);
    const skip = (page - 1) * limit;

    const {
      search,
      category,
      difficulty,
      featured,
      sort = 'newest',
      isPublished,
    } = req.query;

    const query = {};

    // For public catalog, only show published courses unless admin explicitly queries
    if (req.user && req.user.role === 'admin' && isPublished !== undefined) {
      if (isPublished !== 'all') {
        query.isPublished = isPublished === 'true';
      }
    } else {
      query.isPublished = true;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subtitle: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (category && category !== 'all') {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);
      if (isObjectId) {
        query.category = category;
      } else {
        const catDoc = await Category.findOne({ slug: category.toLowerCase() });
        if (catDoc) {
          query.category = catDoc._id;
        }
      }
    }

    if (difficulty && difficulty !== 'all') {
      query.difficulty = difficulty;
    }

    if (featured === 'true') {
      query.featured = true;
    }

    // Sort order
    let sortOptions = { createdAt: -1 };
    if (sort === 'popular') {
      sortOptions = { enrollmentCount: -1 };
    } else if (sort === 'rating') {
      sortOptions = { averageRating: -1, reviewCount: -1 };
    } else if (sort === 'title') {
      sortOptions = { title: 1 };
    } else if (sort === 'oldest') {
      sortOptions = { createdAt: 1 };
    }

    const [courses, total] = await Promise.all([
      Course.find(query)
        .populate('instructor', 'name avatar title bio')
        .populate('category', 'name slug icon')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit),
      Course.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      courses,
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

// @desc Get single course by ID or slug with curriculum
// @route GET /api/courses/:idOrSlug
// @access Public (with optional auth to check enrollment)
const getCourse = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);

    const query = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug.toLowerCase() };

    const course = await Course.findOne(query)
      .populate('instructor', 'name avatar title bio socialLinks')
      .populate('category', 'name slug icon');

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check enrollment and ownership
    let isEnrolled = false;
    let enrollment = null;
    let isOwner = false;

    if (req.user) {
      if (req.user.role === 'admin' || course.instructor._id.toString() === req.user._id.toString()) {
        isOwner = true;
      }

      enrollment = await Enrollment.findOne({
        student: req.user._id,
        course: course._id,
      });

      if (enrollment) {
        isEnrolled = true;
      }
    }

    // If course is draft, only owner or admin can view
    if (!course.isPublished && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'This course is currently unpublished.',
      });
    }

    // Get Sections and Lessons
    const sections = await Section.find({ course: course._id }).sort({ order: 1 });
    const lessons = await Lesson.find({ course: course._id }).sort({ order: 1 });

    // Group lessons into sections
    const curriculum = sections.map((sec) => {
      const secLessons = lessons.filter(
        (les) => les.section.toString() === sec._id.toString()
      ).map((les) => {
        const lesObj = les.toObject();
        // Protect videoUrl and resources for non-enrolled users unless it's a free preview or owner
        if (!isEnrolled && !isOwner && !lesObj.isFreePreview) {
          delete lesObj.videoUrl;
          delete lesObj.resources;
        }
        return lesObj;
      });

      return {
        _id: sec._id,
        title: sec.title,
        order: sec.order,
        lessons: secLessons,
      };
    });

    return res.status(200).json({
      success: true,
      course,
      curriculum,
      isEnrolled,
      enrollment,
      isOwner,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Create course
// @route POST /api/courses
// @access Private (Instructor or Admin)
const createCourse = async (req, res, next) => {
  try {
    const {
      title,
      subtitle,
      description,
      category,
      difficulty,
      price,
      thumbnail,
      prerequisites,
      learningOutcomes,
      isPublished,
    } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and category are required.',
      });
    }

    const slug = slugify(title);

    const course = await Course.create({
      title: title.trim(),
      slug,
      subtitle: subtitle ? subtitle.trim() : '',
      description: description.trim(),
      instructor: req.user._id,
      category,
      difficulty: difficulty || 'beginner',
      price: price !== undefined ? Number(price) : 0,
      thumbnail: thumbnail || undefined,
      prerequisites: Array.isArray(prerequisites) ? prerequisites : [],
      learningOutcomes: Array.isArray(learningOutcomes) ? learningOutcomes : [],
      isPublished: Boolean(isPublished),
    });

    // Update category courseCount
    await Category.findByIdAndUpdate(category, { $inc: { courseCount: 1 } });

    // Create an initial default section for quick onboarding
    await Section.create({
      course: course._id,
      title: 'Introduction & Getting Started',
      order: 1,
    });

    const populatedCourse = await Course.findById(course._id)
      .populate('instructor', 'name avatar title')
      .populate('category', 'name slug');

    return res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course: populatedCourse,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update course
// @route PATCH /api/courses/:id
// @access Private (Course Owner Instructor or Admin)
const updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Role check: Only the course's instructor or admin can update
    const isOwner = course.instructor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only edit your own courses.',
      });
    }

    const {
      title,
      subtitle,
      description,
      category,
      difficulty,
      price,
      thumbnail,
      prerequisites,
      learningOutcomes,
      isPublished,
      featured,
    } = req.body;

    if (title && title !== course.title) {
      course.title = title.trim();
      course.slug = slugify(title);
    }
    if (subtitle !== undefined) course.subtitle = subtitle.trim();
    if (description !== undefined) course.description = description.trim();
    if (difficulty !== undefined) course.difficulty = difficulty;
    if (price !== undefined) course.price = Number(price);
    if (thumbnail !== undefined) course.thumbnail = thumbnail;
    if (prerequisites !== undefined) course.prerequisites = prerequisites;
    if (learningOutcomes !== undefined) course.learningOutcomes = learningOutcomes;
    if (isPublished !== undefined) course.isPublished = Boolean(isPublished);
    if (isAdmin && featured !== undefined) course.featured = Boolean(featured);

    if (category && category.toString() !== course.category.toString()) {
      await Category.findByIdAndUpdate(course.category, { $inc: { courseCount: -1 } });
      await Category.findByIdAndUpdate(category, { $inc: { courseCount: 1 } });
      course.category = category;
    }

    await course.save();

    const updated = await Course.findById(course._id)
      .populate('instructor', 'name avatar title')
      .populate('category', 'name slug');

    return res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      course: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete course (Safe deletion rules)
// @route DELETE /api/courses/:id
// @access Private (Owner or Admin)
const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const isOwner = course.instructor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only delete your own courses.',
      });
    }

    // Safe deletion: check enrollments
    const enrollmentsCount = await Enrollment.countDocuments({ course: course._id });
    const force = req.query.force === 'true';

    if (enrollmentsCount > 0 && !force) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete course with ${enrollmentsCount} active student enrollment(s). Please unpublish the course instead, or contact admin for forced deletion.`,
      });
    }

    // Clean up sections, lessons, category count
    await Promise.all([
      Section.deleteMany({ course: course._id }),
      Lesson.deleteMany({ course: course._id }),
      Category.findByIdAndUpdate(course.category, { $inc: { courseCount: -1 } }),
      Course.findByIdAndDelete(course._id),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Course and related curriculum deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get instructor courses
// @route GET /api/courses/instructor/my-courses or GET /api/instructor/courses
// @access Private (Instructor or Admin)
const getInstructorCourses = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const skip = (page - 1) * limit;

    const query = { instructor: req.user._id };

    const [courses, total] = await Promise.all([
      Course.find(query)
        .populate('category', 'name slug icon')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      Course.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      courses,
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

module.exports = {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getInstructorCourses,
};
