import request from 'supertest';
import { describe, it, expect, jest } from '@jest/globals';

jest.setTimeout(30000);

const API_URL = 'http://localhost:5000';

describe('Faculty Module API Tests', () => {
  let facultyToken: string;
  let studentToken: string;

  it('Login - Faculty User', async () => {
    const res = await request(API_URL)
      .post('/api/v1/auth/login')
      .send({ email: 'user2@edmin.com', password: 'password123' });
    
    expect(res.status).toBe(200);
    facultyToken = res.body.session.access_token;
  });

  it('Login - Student User', async () => {
    const res = await request(API_URL)
      .post('/api/v1/auth/login')
      .send({ email: 'user1@edmin.com', password: 'password123' });
    
    expect(res.status).toBe(200);
    studentToken = res.body.session.access_token;
  });

  it('Faculty can fetch their assigned courses', async () => {
    const res = await request(API_URL)
      .get('/api/v1/faculty/courses')
      .set('Authorization', `Bearer ${facultyToken}`);
      
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('Faculty can fetch students', async () => {
    const res = await request(API_URL)
      .get('/api/v1/faculty/students')
      .set('Authorization', `Bearer ${facultyToken}`);
      
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('Student cannot access faculty routes (403 Forbidden)', async () => {
    const res = await request(API_URL)
      .get('/api/v1/faculty/courses')
      .set('Authorization', `Bearer ${studentToken}`);
      
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
