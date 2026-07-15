import request from 'supertest';
import { describe, it, expect, jest, beforeAll } from '@jest/globals';

jest.setTimeout(30000);

const API_URL = 'http://localhost:5000';

describe('HR Module API Endpoints', () => {
  let hrToken = '';
  let studentToken = '';

  beforeAll(async () => {
    // 1. Get tokens for HR and STUDENT
    const hrLogin = await request(API_URL)
      .post('/api/v1/auth/login')
      .send({ email: 'user4@edmin.com', password: 'password123' });
    hrToken = hrLogin.body.session?.access_token;

    const studentLogin = await request(API_URL)
      .post('/api/v1/auth/login')
      .send({ email: 'user1@edmin.com', password: 'password123' });
    studentToken = studentLogin.body.session?.access_token;
  });

  describe('GET /api/v1/dashboard/hr', () => {
    it('should allow HR users to fetch the HR dashboard data', async () => {
      const res = await request(API_URL)
        .get('/api/v1/dashboard/hr')
        .set('Authorization', `Bearer ${hrToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it('should deny STUDENT users from accessing the HR dashboard', async () => {
      const res = await request(API_URL)
        .get('/api/v1/dashboard/hr')
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect(res.status).toBe(403);
    });
  });
});
