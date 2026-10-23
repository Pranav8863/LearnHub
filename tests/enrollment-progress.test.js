const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const connectDB = require('../src/config/db');
const Course = require('../src/models/Course');
const Lesson = require('../src/models/Lesson');
const Enrollment = require('../src/models/Enrollment');

let studentToken = null;
let newStudentToken = null;
let testCourse = null;
let testLesson = null;

test.before(async () => {
  await connectDB();

  // Login existing student
  const studRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'student1@learnhub.com', password: 'Student123!' });
  studentToken = studRes.body.token;

  // Register a brand new student for fresh enrollment tests
  const freshEmail = `fresh.student.${Date.now()}@learnhub.com`;
  const regRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Fresh Student',
      email: freshEmail,
      password: 'Password123!',
      role: 'student',
    });
  newStudentToken = regRes.body.token;

  testCourse = await Course.findOne({ isPublished: true, totalLessons: { $gt: 0 } });
  testLesson = await Lesson.findOne({ course: testCourse._id });
});

test.after(async () => {
  await mongoose.connection.close();
});

test('POST /api/courses/:courseId/enroll - Enrolls a student successfully', async () => {
  const res = await request(app)
    .post(`/api/courses/${testCourse._id}/enroll`)
    .set('Authorization', `Bearer ${newStudentToken}`);

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.enrollment.status, 'active');
  assert.equal(res.body.enrollment.progressPercentage, 0);
});

test('POST /api/courses/:courseId/enroll - Prevents duplicate enrollment', async () => {
  const res = await request(app)
    .post(`/api/courses/${testCourse._id}/enroll`)
    .set('Authorization', `Bearer ${newStudentToken}`);

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
});

test('PATCH /api/courses/:courseId/lessons/:lessonId/progress - Updates lesson progress and recalculates percentage', async () => {
  const res = await request(app)
    .patch(`/api/courses/${testCourse._id}/lessons/${testLesson._id}/progress`)
    .set('Authorization', `Bearer ${newStudentToken}`)
    .send({ isCompleted: true });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.progress.isCompleted, true);
  assert.ok(res.body.progressPercentage > 0);
});

test('PATCH /api/courses/:courseId/lessons/:lessonId/progress - Blocks progress submission if lesson does not belong to course', async () => {
  const otherCourse = await Course.findOne({ _id: { $ne: testCourse._id }, isPublished: true });
  const otherLesson = await Lesson.findOne({ course: otherCourse._id });

  const res = await request(app)
    .patch(`/api/courses/${testCourse._id}/lessons/${otherLesson._id}/progress`)
    .set('Authorization', `Bearer ${newStudentToken}`)
    .send({ isCompleted: true });

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
});
