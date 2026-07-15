import request from 'supertest';
import { describe, it, expect, jest } from '@jest/globals';

jest.setTimeout(30000);

const API_URL = 'http://localhost:5000';

describe('Authentication API Module', () => {
  let sessionToken: string;

  it('Login - Successful Login with valid credentials', async () => {
    const res = await request(API_URL)
      .post('/api/v1/auth/login')
      .send({ email: 'user3@edmin.com', password: 'password123' });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.session).toBeDefined();
    expect(res.body.session.access_token).toBeDefined();
    
    sessionToken = res.body.session.access_token;
  });

  it('Login - Failed Login with incorrect credentials', async () => {
    const res = await request(API_URL)
      .post('/api/v1/auth/login')
      .send({ email: 'user3@edmin.com', password: 'wrongpassword' });
    
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('Login - Failed Login with missing credentials', async () => {
    const res = await request(API_URL)
      .post('/api/v1/auth/login')
      .send({});
    
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('Get Profile /auth/me - Succeeds with valid token', async () => {
    const res = await request(API_URL)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${sessionToken}`);
      
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('user3@edmin.com');
  });

  it('Get Profile /auth/me - Fails without token', async () => {
    const res = await request(API_URL)
      .get('/api/v1/auth/me');
      
    expect(res.status).toBe(401);
  });

  it('Logout - Successfully logs out', async () => {
    const res = await request(API_URL)
      .post('/api/v1/auth/logout')
      .set('Cookie', ['refresh_token=test-refresh-token']);
      
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
