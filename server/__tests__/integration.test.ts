import request from 'supertest';
import { describe, it, expect, jest } from '@jest/globals';

jest.setTimeout(30000);

const API_URL = 'http://localhost:5000';

describe('System Integration Tests - User Dashboard Flow', () => {
  let studentToken = '';

  it('1. User should successfully log in and receive an access token', async () => {
    const res = await request(API_URL)
      .post('/api/v1/auth/login')
      .send({ email: 'user1@edmin.com', password: 'password123' });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.session?.access_token).toBeDefined();
    studentToken = res.body.session.access_token;
  });

  it('2. User should access their role-specific dashboard (Cache Miss)', async () => {
    const res = await request(API_URL)
      .get('/api/v1/dashboard/student')
      .set('Authorization', `Bearer ${studentToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined(); // The data should come from DB
  });

  it('3. User should access their dashboard again (Cache Hit)', async () => {
    // The previous request should have cached the dashboard in Redis
    const res = await request(API_URL)
      .get('/api/v1/dashboard/student')
      .set('Authorization', `Bearer ${studentToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined(); // Data comes from Redis now
  });

  it('4. User should fetch their own profile details', async () => {
    const res = await request(API_URL)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${studentToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('user1@edmin.com');
  });

  it('5. User gets 401 Unauthorized with invalid token', async () => {
    const res = await request(API_URL)
      .get('/api/v1/dashboard/student')
      .set('Authorization', `Bearer invalid.token.here`);
    
    expect(res.status).toBe(401);
  });
});
