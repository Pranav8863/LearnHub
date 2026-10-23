const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  url: {
    type: String,
    required: true,
    trim: true,
  },
});

const lessonSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true,
      maxlength: [150, 'Lesson title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    videoUrl: {
      type: String,
      default: '',
    },
    duration: {
      type: Number, // in minutes
      default: 5,
      min: [0, 'Duration cannot be negative'],
    },
    order: {
      type: Number,
      default: 1,
    },
    resources: {
      type: [resourceSchema],
      default: [],
    },
    isFreePreview: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

lessonSchema.index({ course: 1, section: 1, order: 1 });

module.exports = mongoose.model('Lesson', lessonSchema);
