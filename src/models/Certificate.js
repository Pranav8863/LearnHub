const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    courseTitle: {
      type: String,
      required: true,
    },
    instructorName: {
      type: String,
      required: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    grade: {
      type: Number,
      default: 100,
    },
  },
  {
    timestamps: true,
  }
);

// One certificate per student per course
certificateSchema.index({ student: 1, course: 1 }, { unique: true });

// Public view method stripping private student ID
certificateSchema.methods.toPublicView = function () {
  return {
    certificateId: this.certificateId,
    studentName: this.studentName,
    courseTitle: this.courseTitle,
    instructorName: this.instructorName,
    issuedAt: this.issuedAt,
    grade: this.grade,
    isVerified: true,
  };
};

module.exports = mongoose.model('Certificate', certificateSchema);
