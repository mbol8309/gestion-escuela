// Setup: use in-memory SQLite for tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.RESEND_API_KEY = 'test-key-placeholder';

const request = require('supertest');
const { app, sequelize, seedAdmin } = require('../../server');

let adminToken;

beforeAll(async () => {
  await sequelize.sync({ force: true }); // Fresh DB for each test run
  await seedAdmin();
  // Login to get admin token
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@admin.com', password: 'admin' });
  adminToken = res.body.token;
});

afterAll(async () => {
  await sequelize.close();
});

// ── Health ──────────────────────────────────────────────────────────────────
describe('GET /api/health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

// ── Auth ────────────────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  it('returns JWT for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@admin.com', password: 'admin' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.role).toBe('admin');
  });

  it('rejects invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@admin.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('rejects unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'noexiste@test.com', password: 'admin' });
    expect(res.status).toBe(401);
  });

  it('rejects missing token on protected route', async () => {
    const res = await request(app).get('/api/students');
    expect(res.status).toBe(401);
  });
});

// ── Students ─────────────────────────────────────────────────────────────────
describe('Students API', () => {
  let studentId;

  it('creates a student', async () => {
    const res = await request(app)
      .post('/api/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ firstName: 'Ana', lastName: 'García', email: 'ana@test.com', dni: '12345678A' });
    expect(res.status).toBe(201);
    expect(res.body.firstName).toBe('Ana');
    studentId = res.body.id;
  });

  it('rejects duplicate email with 409', async () => {
    const res = await request(app)
      .post('/api/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ firstName: 'Ana2', lastName: 'García', email: 'ana@test.com', dni: '99999999Z' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/ya existe/i);
  });

  it('lists students', async () => {
    const res = await request(app)
      .get('/api/students')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body.total).toBeGreaterThan(0);
  });

  it('gets student by id', async () => {
    const res = await request(app)
      .get(`/api/students/${studentId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(studentId);
  });

  it('deletes student (admin only)', async () => {
    const res = await request(app)
      .delete(`/api/students/${studentId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

// ── Courses ──────────────────────────────────────────────────────────────────
describe('Courses API', () => {
  let courseId;

  it('creates a course', async () => {
    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Máster Uñas', description: 'Curso completo', active: true });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Máster Uñas');
    courseId = res.body.id;
  });

  it('lists courses', async () => {
    const res = await request(app)
      .get('/api/courses')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('gets course by id', async () => {
    const res = await request(app)
      .get(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(courseId);
  });
});

// ── Config ───────────────────────────────────────────────────────────────────
describe('Config API', () => {
  it('reads config (requires auth)', async () => {
    const res = await request(app)
      .get('/api/config')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('updates config', async () => {
    const res = await request(app)
      .put('/api/config')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ academy_name: 'Test Academy' });
    expect(res.status).toBe(200);
  });
});
