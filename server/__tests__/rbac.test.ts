import request from 'supertest';
import { describe, it, expect, jest } from '@jest/globals';

jest.setTimeout(30000);

const API_URL = 'http://localhost:5000';

describe('Roles & Permissions (RBAC) Module API Tests', () => {
  let adminToken: string;
  let studentToken: string;

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

  it('Admin can access protected admin route (Role Check)', async () => {
    // /api/v1/admin/users requires ADMIN role and USERS:READ permission
    const res = await request(API_URL)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
      
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('Student cannot access protected admin route (403 Forbidden)', async () => {
    const res = await request(API_URL)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${studentToken}`);
      
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
  
  it('Access without token returns 401 Unauthorized', async () => {
    const res = await request(API_URL)
      .get('/api/v1/admin/users');
      
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
