// const request = require('supertest');
// const { app, pool, closePool } = require('../server');
// require('dotenv').config({ path: '.env.test' });

// let server;

// beforeAll(async () => {
//   try {
//     // Create test server
//     server = app.listen(0);
    
//     // Get connection from pool
//     const connection = await pool.getConnection();
    
//     // Make sure we're using the test database
//     await connection.query(`USE ${process.env.DB_NAME_TEST}`);
    
//     // Clear the users table
//     await connection.query('DELETE FROM users');
    
//     connection.release();
//   } catch (error) {
//     console.error('Setup error:', error);
//     throw error;
//   }
// });

// afterAll(async () => {
//   if (server) {
//     await new Promise((resolve) => server.close(resolve));
//   }
//   await closePool();
// });

// describe('User Management API Tests', () => {
//   // Test 1: Register a new user
//   test('should register a new user successfully', async () => {
//     const res = await request(server)
//       .post('/api/auth/register')
//       .send({
//         name: 'Test User',
//         email: 'test@example.com',
//         password: 'password123'
//       });

//     expect(res.status).toBe(201);
//     expect(res.body.user).toHaveProperty('id');
//     expect(res.body.user.name).toBe('Test User');
//     expect(res.body.user.email).toBe('test@example.com');
//   });

//   // Test 2: Login with valid credentials
//   test('should login successfully with valid credentials', async () => {
//     const res = await request(server)
//       .post('/api/auth/login')
//       .send({
//         email: 'test@example.com',
//         password: 'password123'
//       });

//     expect(res.status).toBe(200);
//     expect(res.body.message).toBe('Login successful');
//     expect(res.body.user).toHaveProperty('id');
//   });

//   // Test 3: Get all users
//   test('should get list of all users', async () => {
//     const res = await request(server)
//       .get('/api/users');

//     expect(res.status).toBe(200);
//     expect(Array.isArray(res.body)).toBe(true);
//   });

//   // Test 4: Register with invalid data
//   test('should fail to register user with missing required fields', async () => {
//     const res = await request(server)
//       .post('/api/auth/register')
//       .send({
//         name: 'Invalid User',
//         // email is missing
//         password: 'password123'
//       });

//     expect(res.status).toBe(400);
//     expect(res.body.message).toBe('Name, email and password are required');
//   });

//   // Test 5: Login with invalid credentials
//   test('should fail to login with wrong password', async () => {
//     const res = await request(server)
//       .post('/api/auth/login')
//       .send({
//         email: 'test@example.com',
//         password: 'wrongpassword'
//       });

//     expect(res.status).toBe(401);
//     expect(res.body.message).toBe('Invalid credentials');
//   });
// }); 


const request = require('supertest');
const app = require('../app');
const db = require('../config');

let token = '';

beforeAll(done => {
  // Clear and setup test user
  db.query('DELETE FROM users WHERE username = ?', ['testuser'], () => {
    done();
  });
});

afterAll(() => {
  db.end(); // Close DB connection after tests
});

describe('User API', () => {
  it('should register a new user', async () => {
    const res = await request(app).post('/api/register').send({
      username: 'testuser',
      password: 'testpass'
    });
    expect(res.statusCode).toEqual(201);
    expect(res.body.message).toBe('User registered');
  });

  it('should login and return token', async () => {
    const res = await request(app).post('/api/login').send({
      username: 'testuser',
      password: 'testpass'
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  it('should fetch profile with token', async () => {
    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.username).toBe('testuser');
  });

  it('should reject access without token', async () => {
    const res = await request(app).get('/api/profile');
    expect(res.statusCode).toEqual(401);
  });

  it('should reject wrong login', async () => {
    const res = await request(app).post('/api/login').send({
      username: 'testuser',
      password: 'wrongpass'
    });
    expect(res.statusCode).toEqual(401);
  });
});

// push
