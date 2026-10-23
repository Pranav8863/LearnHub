const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const connectDB = require('../src/config/db');

test.before(async () => {
  await connectDB();
});

test.after(async () => {
  await mongoose.connection.close();
});

test('POST /api/auth/register - Successfully registers a new student', async () => {
  const randomEmail = `test.student.${Date.now()}@learnhub.com`;
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test Student',
      email: randomEmail,
      password: 'Password123!',
      role: 'student',
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.user.role, 'student');
  assert.ok(res.body.token);
  assert.equal(res.body.user.password, undefined);
});

test('POST /api/auth/register - Rejects registration attempt with admin role', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Hacker Admin',
      email: `hacker.${Date.now()}@learnhub.com`,
      password: 'Password123!',
      role: 'admin',
    });

  assert.ok([400, 403].includes(res.status));
  assert.equal(res.body.success, false);
});

test('POST /api/auth/register - Rejects duplicate email address', async () => {
  const duplicateEmail = 'student1@learnhub.com';
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Duplicate Student',
      email: duplicateEmail,
      password: 'Password123!',
      role: 'student',
    });

  assert.equal(res.status, 409);
  assert.equal(res.body.success, false);
});

test('POST /api/auth/login - Rejects invalid credentials', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'admin@learnhub.com',
      password: 'WrongPassword999',
    });

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

test('POST /api/auth/login - Logs in successfully with correct credentials', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'admin@learnhub.com',
      password: 'Admin123!',
    });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.user.role, 'admin');
  assert.ok(res.body.token);
});

test('GET /api/auth/me - Returns current authenticated user profile', async () => {
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'admin@learnhub.com',
      password: 'Admin123!',
    });

  const token = loginRes.body.token;

  const res = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.user.email, 'admin@learnhub.com');
  assert.equal(res.body.user.password, undefined);
});
