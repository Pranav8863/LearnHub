const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
  },
  options: {
    type: [String],
    validate: {
      validator: (arr) => arr && arr.length >= 2,
      message: 'Each question must have at least 2 options',
    },
  },
  correctOptionIndex: {
    type: Number,
    required: [true, 'Correct option index is required'],
    min: 0,
  },
  explanation: {
    type: String,
    default: '',
  },
});

const quizSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    passingScore: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
    },
    questions: {
      type: [questionSchema],
      validate: {
        validator: (arr) => arr && arr.length > 0,
        message: 'Quiz must have at least one question',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Method to sanitize questions for students before submission
quizSchema.methods.toStudentView = function () {
  const quizObj = this.toObject();
  quizObj.questions = quizObj.questions.map((q) => {
    const { correctOptionIndex, explanation, ...sanitized } = q;
    return sanitized;
  });
  return quizObj;
};

module.exports = mongoose.model('Quiz', quizSchema);
