import request from 'supertest';
import { describe, it, expect, jest, beforeAll } from '@jest/globals';

jest.setTimeout(30000);

const API_URL = 'http://localhost:5000';

describe('Course API Endpoints', () => {
  let studentToken = '';
  let adminToken = '';
  let facultyToken = '';

  beforeAll(async () => {
    // 1. Get tokens for STUDENT, ADMIN, FACULTY
    const studentLogin = await request(API_URL)
      .post('/api/v1/auth/login')
      .send({ email: 'user1@edmin.com', password: 'password123' });
    studentToken = studentLogin.body.session?.access_token;

    const adminLogin = await request(API_URL)
      .post('/api/v1/auth/login')
      .send({ email: 'user3@edmin.com', password: 'password123' });
    adminToken = adminLogin.body.session?.access_token;

    const facultyLogin = await request(API_URL)
      .post('/api/v1/auth/login')
      .send({ email: 'user2@edmin.com', password: 'password123' });
    facultyToken = facultyLogin.body.session?.access_token;
  });

  describe('GET /api/courses', () => {
    it('should allow authenticated users to fetch all courses', async () => {
      const res = await request(API_URL)
        .get('/api/courses')
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.courses)).toBe(true);
    });

    it('should deny unauthenticated users', async () => {
      const res = await request(API_URL).get('/api/courses');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/courses/offerings', () => {
    it('should allow authenticated users to fetch course offerings', async () => {
      const res = await request(API_URL)
        .get('/api/courses/offerings')
        .set('Authorization', `Bearer ${facultyToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.offerings)).toBe(true);
    });
  });

  describe('POST /api/courses', () => {
    it('should deny STUDENT users from creating courses', async () => {
      const res = await request(API_URL)
        .post('/api/courses')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ code: 'CS102', name: 'Intro to CS 2' });
        
      expect(res.status).toBe(403);
    });

    it('should allow ADMIN users to create courses', async () => {
      const code = 'TEST' + Math.floor(Math.random() * 10000);
      const res = await request(API_URL)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code, name: 'Test Course' });
        
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.course).toHaveProperty('courseid');
      expect(res.body.course.code).toBe(code);
    });
  });
});
