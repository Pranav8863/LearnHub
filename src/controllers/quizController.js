const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// @desc Create quiz for a course
// @route POST /api/courses/:courseId/quizzes
// @access Private (Instructor/Admin)
const createQuiz = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { title, description, passingScore, questions, lessonId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const isOwner = course.instructor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Quiz title and at least one question are required.',
      });
    }

    const quiz = await Quiz.create({
      course: courseId,
      lesson: lessonId || null,
      title: title.trim(),
      description: description || '',
      passingScore: passingScore !== undefined ? Number(passingScore) : 70,
      questions,
    });

    return res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      quiz,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get quizzes for a course
// @route GET /api/courses/:courseId/quizzes
// @access Private (Enrolled Student, Instructor, Admin)
const getCourseQuizzes = async (req, res, next) => {
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
        message: 'You must be enrolled to view quizzes for this course.',
      });
    }

    const quizzes = await Quiz.find({ course: courseId }).sort({ createdAt: 1 });

    const processedQuizzes = quizzes.map((q) => {
      if (isOwner || isAdmin) {
        return q;
      }
      return q.toStudentView();
    });

    return res.status(200).json({
      success: true,
      quizzes: processedQuizzes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get quiz by ID
// @route GET /api/quizzes/:id
// @access Private
const getQuizById = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('course', 'title instructor');
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    const isOwner = quiz.course.instructor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const enrollment = await Enrollment.findOne({ student: req.user._id, course: quiz.course._id });

    if (!isOwner && !isAdmin && !enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled to take this quiz.',
      });
    }

    // Include last attempt if student
    let userAttempts = [];
    if (!isOwner && !isAdmin) {
      userAttempts = await QuizAttempt.find({
        student: req.user._id,
        quiz: quiz._id,
      }).sort({ createdAt: -1 });
    }

    const responseQuiz = (isOwner || isAdmin) ? quiz : quiz.toStudentView();

    return res.status(200).json({
      success: true,
      quiz: responseQuiz,
      attempts: userAttempts,
      canManage: isOwner || isAdmin,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Submit quiz attempt and grade answers on backend
// @route POST /api/quizzes/:id/attempts
// @access Private (Enrolled Student)
const submitQuizAttempt = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    // Verify enrollment
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: quiz.course,
    });

    if (!enrollment && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Must be enrolled in the course to submit quiz attempts.',
      });
    }

    const { userAnswers } = req.body;
    // Expected format: [{ questionIndex: 0, selectedOptionIndex: 1 }, ...]
    if (!userAnswers || !Array.isArray(userAnswers)) {
      return res.status(400).json({
        success: false,
        message: 'userAnswers array is required.',
      });
    }

    let correctCount = 0;
    const totalQuestions = quiz.questions.length;
    const answersEvaluation = [];

    // Evaluate answers
    quiz.questions.forEach((q, idx) => {
      const submission = userAnswers.find((ans) => ans.questionIndex === idx);
      const selectedOptionIndex = submission !== undefined && submission.selectedOptionIndex !== undefined
        ? Number(submission.selectedOptionIndex)
        : -1;

      const isCorrect = selectedOptionIndex === q.correctOptionIndex;
      if (isCorrect) correctCount++;

      answersEvaluation.push({
        questionIndex: idx,
        selectedOptionIndex,
        isCorrect,
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation,
      });
    });

    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passed = score >= quiz.passingScore;

    const attempt = await QuizAttempt.create({
      student: req.user._id,
      quiz: quiz._id,
      course: quiz.course,
      answers: answersEvaluation.map((a) => ({
        questionIndex: a.questionIndex,
        selectedOptionIndex: a.selectedOptionIndex,
        isCorrect: a.isCorrect,
      })),
      score,
      totalQuestions,
      correctAnswersCount: correctCount,
      passed,
    });

    return res.status(200).json({
      success: true,
      message: passed
        ? `Congratulations! You passed with ${score}%.`
        : `You scored ${score}%. The passing score is ${quiz.passingScore}%. Try again!`,
      attempt: {
        _id: attempt._id,
        score,
        totalQuestions,
        correctAnswersCount: correctCount,
        passed,
        passingScore: quiz.passingScore,
        evaluations: answersEvaluation,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get quiz results / attempts
// @route GET /api/quizzes/:id/results
// @access Private
const getQuizResults = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    const course = await Course.findById(quiz.course);
    const isOwner = course.instructor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    let query = { quiz: quiz._id };
    if (!isOwner && !isAdmin) {
      query.student = req.user._id;
    }

    const attempts = await QuizAttempt.find(query)
      .populate('student', 'name email avatar')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      attempts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get all student quizzes
// @route GET /api/quizzes/student/my-quizzes
// @access Private (Student)
const getStudentQuizzes = async (req, res, next) => {
  try {
    // Find all enrolled courses
    const enrollments = await Enrollment.find({ student: req.user._id }).select('course');
    const courseIds = enrollments.map((e) => e.course);

    // Find all quizzes for these courses
    const quizzes = await Quiz.find({ course: { $in: courseIds } })
      .populate('course', 'title slug thumbnail')
      .sort({ createdAt: -1 });

    // Fetch user attempts
    const attempts = await QuizAttempt.find({ student: req.user._id }).sort({ createdAt: -1 });

    const quizzesWithStatus = quizzes.map((quiz) => {
      const quizAttempts = attempts.filter((a) => a.quiz.toString() === quiz._id.toString());
      const hasPassed = quizAttempts.some((a) => a.passed);
      const bestScore = quizAttempts.reduce((max, a) => Math.max(max, a.score), 0);

      return {
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        course: quiz.course,
        passingScore: quiz.passingScore,
        totalQuestions: quiz.questions.length,
        attemptsCount: quizAttempts.length,
        hasPassed,
        bestScore,
        lastAttempt: quizAttempts[0] || null,
      };
    });

    return res.status(200).json({
      success: true,
      quizzes: quizzesWithStatus,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createQuiz,
  getCourseQuizzes,
  getQuizById,
  submitQuizAttempt,
  getQuizResults,
  getStudentQuizzes,
};
