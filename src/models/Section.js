const mongoose = require('mongoose');

const practiceQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
  },
  options: {
    type: [String],
    required: true,
    validate: [(val) => val.length >= 2, 'At least 2 options required'],
  },
  correctOption: {
    type: Number,
    required: true,
    default: 0,
  },
  explanation: {
    type: String,
    default: '',
  },
  hint: {
    type: String,
    default: '',
  },
});

const sectionSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Section title is required'],
      trim: true,
      maxlength: [150, 'Section title cannot exceed 150 characters'],
    },
    notes: {
      type: String,
      default: '',
    },
    practiceQuestions: {
      type: [practiceQuestionSchema],
      default: [],
    },
    order: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

sectionSchema.index({ course: 1, order: 1 });

module.exports = mongoose.model('Section', sectionSchema);
