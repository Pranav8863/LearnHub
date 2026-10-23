const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const connectDB = require('../src/config/db');
const Quiz = require('../src/models/Quiz');
const Certificate = require('../src/models/Certificate');
const Course = require('../src/models/Course');
const Enrollment = require('../src/models/Enrollment');

let studentToken = null;
let testQuiz = null;

test.before(async () => {
  await connectDB();

  const studRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'student1@learnhub.com', password: 'Student123!' });
  studentToken = studRes.body.token;

  testQuiz = await Quiz.findOne();
});

test.after(async () => {
  await mongoose.connection.close();
});

test('GET /api/quizzes/:id - Sanitizes questions for students, stripping correct answers', async () => {
  const res = await request(app)
    .get(`/api/quizzes/${testQuiz._id}`)
    .set('Authorization', `Bearer ${studentToken}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.quiz.questions.length > 0);

  // Security check: Verify neither correctOptionIndex nor explanation are sent
  res.body.quiz.questions.forEach((q) => {
    assert.equal(q.correctOptionIndex, undefined);
    assert.equal(q.explanation, undefined);
  });
});

test('POST /api/quizzes/:id/attempts - Grades quiz on backend and returns feedback with explanations', async () => {
  const rawQuiz = await Quiz.findById(testQuiz._id);
  const correctSubmissions = rawQuiz.questions.map((q, idx) => ({
    questionIndex: idx,
    selectedOptionIndex: q.correctOptionIndex,
  }));

  const res = await request(app)
    .post(`/api/quizzes/${testQuiz._id}/attempts`)
    .set('Authorization', `Bearer ${studentToken}`)
    .send({ userAnswers: correctSubmissions });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.attempt.score, 100);
  assert.equal(res.body.attempt.passed, true);
  assert.ok(res.body.attempt.evaluations.length > 0);
  assert.equal(res.body.attempt.evaluations[0].isCorrect, true);
});

test('GET /api/certificates/verify/:certificateId - Public verification returns certificate without private user ID', async () => {
  const sampleCert = await Certificate.findOne();
  assert.ok(sampleCert, 'Sample certificate exists from seed');

  const res = await request(app)
    .get(`/api/certificates/verify/${sampleCert.certificateId}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.certificate.isVerified, true);
  assert.equal(res.body.certificate.certificateId, sampleCert.certificateId);
  assert.equal(res.body.certificate.studentName, sampleCert.studentName);
  assert.equal(res.body.certificate.student, undefined); // Private ID not exposed
});

test('POST /api/courses/:courseId/claim - Blocks certificate claim if course progress is below 100%', async () => {
  const incompleteEnr = await Enrollment.findOne({ progressPercentage: { $lt: 100 } });
  if (incompleteEnr) {
    const studRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student3@learnhub.com', password: 'Student123!' });

    const res = await request(app)
      .post(`/api/courses/${incompleteEnr.course}/claim`)
      .set('Authorization', `Bearer ${studRes.body.token}`);

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  }
});
