import request from 'supertest';
import { describe, it, expect, jest, beforeAll } from '@jest/globals';

jest.setTimeout(30000);

const API_URL = 'http://localhost:5000';

describe('Finance API Endpoints', () => {
  let studentToken = '';
  let adminToken = '';

  beforeAll(async () => {
    // 1. Get tokens for STUDENT and ADMIN
    const studentLogin = await request(API_URL)
      .post('/api/v1/auth/login')
      .send({ email: 'user1@edmin.com', password: 'password123' });
    studentToken = studentLogin.body.session?.access_token;

    const adminLogin = await request(API_URL)
      .post('/api/v1/auth/login')
      .send({ email: 'user3@edmin.com', password: 'password123' });
    adminToken = adminLogin.body.session?.access_token;
  });

  describe('GET /api/v1/admin/finance/payroll', () => {
    it('should allow ADMIN users to fetch payrolls', async () => {
      const res = await request(API_URL)
        .get('/api/v1/admin/finance/payroll')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should deny STUDENT users', async () => {
      const res = await request(API_URL)
        .get('/api/v1/admin/finance/payroll')
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/admin/finance/fees', () => {
    it('should allow ADMIN users to fetch fees', async () => {
      const res = await request(API_URL)
        .get('/api/v1/admin/finance/fees')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/admin/finance/invoices', () => {
    it('should allow ADMIN users to fetch invoices', async () => {
      const res = await request(API_URL)
        .get('/api/v1/admin/finance/invoices')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
