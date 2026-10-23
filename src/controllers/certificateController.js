const crypto = require('crypto');
const Certificate = require('../models/Certificate');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');

const generateCertificateId = () => {
  const year = new Date().getFullYear();
  const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `LH-${year}-${randomPart}`;
};

// @desc Claim or generate certificate for completed course
// @route POST /api/courses/:courseId/certificate/claim
// @access Private (Enrolled Student)
const claimCertificate = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;

    // Check enrollment
    const enrollment = await Enrollment.findOne({ student: studentId, course: courseId });
    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this course.',
      });
    }

    if (enrollment.progressPercentage < 100) {
      return res.status(400).json({
        success: false,
        message: `Course progress is ${enrollment.progressPercentage}%. You must complete 100% of the lessons to earn a certificate.`,
      });
    }

    // Check if certificate already generated
    let certificate = await Certificate.findOne({ student: studentId, course: courseId });
    if (certificate) {
      return res.status(200).json({
        success: true,
        message: 'Certificate already issued.',
        certificate: certificate.toPublicView(),
      });
    }

    // Fetch student and course details
    const [student, course] = await Promise.all([
      User.findById(studentId),
      Course.findById(courseId).populate('instructor', 'name'),
    ]);

    const certificateId = generateCertificateId();

    certificate = await Certificate.create({
      certificateId,
      student: studentId,
      course: courseId,
      studentName: student.name,
      courseTitle: course.title,
      instructorName: course.instructor ? course.instructor.name : 'LearnHub Faculty',
      issuedAt: new Date(),
      grade: 100,
    });

    return res.status(201).json({
      success: true,
      message: 'Congratulations! Your certificate has been issued.',
      certificate: certificate.toPublicView(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get student's certificates
// @route GET /api/certificates/my-certificates
// @access Private (Student)
const getMyCertificates = async (req, res, next) => {
  try {
    const certificates = await Certificate.find({ student: req.user._id })
      .populate('course', 'title slug thumbnail')
      .sort({ issuedAt: -1 });

    return res.status(200).json({
      success: true,
      certificates,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Public verification of certificate
// @route GET /api/certificates/verify/:certificateId
// @access Public
const verifyCertificate = async (req, res, next) => {
  try {
    const { certificateId } = req.params;
    const certificate = await Certificate.findOne({
      certificateId: certificateId.trim().toUpperCase(),
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        isVerified: false,
        message: 'Certificate ID not found or invalid.',
      });
    }

    return res.status(200).json({
      success: true,
      certificate: certificate.toPublicView(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  claimCertificate,
  getMyCertificates,
  verifyCertificate,
};
