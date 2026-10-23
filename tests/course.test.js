const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const connectDB = require('../src/config/db');
const Category = require('../src/models/Category');
const Course = require('../src/models/Course');

let instructorToken = null;
let studentToken = null;
let categoryId = null;

test.before(async () => {
  await connectDB();

  // Login instructor
  const instRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'sarah@learnhub.com', password: 'Instructor123!' });
  instructorToken = instRes.body.token;

  // Login student
  const studRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'student1@learnhub.com', password: 'Student123!' });
  studentToken = studRes.body.token;

  const cat = await Category.findOne();
  categoryId = cat._id;
});

test.after(async () => {
  await mongoose.connection.close();
});

test('GET /api/courses - Returns published courses for public visitors', async () => {
  const res = await request(app).get('/api/courses');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(Array.isArray(res.body.courses));
  assert.ok(res.body.courses.length > 0);

  // Verify all returned courses are published
  res.body.courses.forEach((c) => {
    assert.equal(c.isPublished, true);
  });
});

test('POST /api/courses - Rejects course creation by student (Role Permission)', async () => {
  const res = await request(app)
    .post('/api/courses')
    .set('Authorization', `Bearer ${studentToken}`)
    .send({
      title: 'Unauthorized Course',
      description: 'Student attempting to create a course',
      category: categoryId,
    });

  assert.equal(res.status, 403);
  assert.equal(res.body.success, false);
});

test('POST /api/courses - Allows instructor to create course', async () => {
  const uniqueTitle = `Testing Instructor Course ${Date.now()}`;
  const res = await request(app)
    .post('/api/courses')
    .set('Authorization', `Bearer ${instructorToken}`)
    .send({
      title: uniqueTitle,
      subtitle: 'A verified test course',
      description: 'Detailed description for test course creation in automated test suite.',
      category: categoryId,
      difficulty: 'beginner',
      isPublished: true,
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.course.title, uniqueTitle);
  assert.ok(res.body.course.slug);

  // Clean up created test course
  await Course.findByIdAndDelete(res.body.course._id);
});

test('PATCH /api/courses/:id - Prevents instructor from editing another instructor\'s course', async () => {
  const alexRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'alex@learnhub.com', password: 'Instructor123!' });
  const alexToken = alexRes.body.token;

  const sarahCourse = await Course.findOne({ slug: 'mastering-full-stack-mern-architecture' });

  const res = await request(app)
    .patch(`/api/courses/${sarahCourse._id}`)
    .set('Authorization', `Bearer ${alexToken}`)
    .send({
      title: 'Hacked Title Attempt',
    });

  assert.equal(res.status, 403);
  assert.equal(res.body.success, false);
});
