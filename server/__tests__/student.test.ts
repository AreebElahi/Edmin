import request from 'supertest';
import { describe, it, expect, jest } from '@jest/globals';

jest.setTimeout(30000);

const API_URL = 'http://localhost:5000';

describe('Student Module API Tests', () => {
  let studentToken: string;
  let adminToken: string;

  it('Login - Admin User', async () => {
    const res = await request(API_URL)
      .post('/api/v1/auth/login')
      .send({ email: 'user3@edmin.com', password: 'password123' });
    
    expect(res.status).toBe(200);
    adminToken = res.body.session.access_token;
  });

  it('Login - Student User', async () => {
    const res = await request(API_URL)
      .post('/api/v1/auth/login')
      .send({ email: 'user1@edmin.com', password: 'password123' });
    
    expect(res.status).toBe(200);
    studentToken = res.body.session.access_token;
  });

  it('Student can fetch their profile', async () => {
    const res = await request(API_URL)
      .get('/api/v1/student/profile')
      .set('Authorization', `Bearer ${studentToken}`);
      
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('student');
    expect(res.body.data.student).toHaveProperty('studentid');
  });

  it('Student can fetch their courses', async () => {
    const res = await request(API_URL)
      .get('/api/v1/student/courses')
      .set('Authorization', `Bearer ${studentToken}`);
      
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('Student can fetch available enrollments', async () => {
    const res = await request(API_URL)
      .get('/api/v1/student/enrollment')
      .set('Authorization', `Bearer ${studentToken}`);
      
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('Admin cannot access student routes (403 Forbidden)', async () => {
    const res = await request(API_URL)
      .get('/api/v1/student/profile')
      .set('Authorization', `Bearer ${adminToken}`);
      
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
