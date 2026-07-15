import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisConnection } from '../config/queue.js';

const getStore = () => {
  if (redisConnection && (redisConnection as any).status === 'ready') {
    return new RedisStore({
      sendCommand: (...args: string[]) => redisConnection.call(...args) as any,
    });
  }
  return undefined; // Falls back to memory store if Redis is absent or offline
};

const isDev = process.env.NODE_ENV !== 'production';

// Global limit: 1000 requests per 15 minutes
export const globalLimiter = rateLimit({
  store: getStore(),
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 1000,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests' } }
});

// Auth limit: 10 requests per 15 minutes
export const authLimiter = rateLimit({
  store: getStore(),
  windowMs: 15 * 60 * 1000,
  max: isDev ? 500 : 10,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many authentication attempts, please try again later' } }
});

// SSE Stream limit: 5 requests per minute to prevent connection exhaustion
export const sseLimiter = rateLimit({
  store: getStore(),
  windowMs: 60 * 1000,
  max: isDev ? 100 : 5,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many SSE connections' } }
});

// Student limit: 100 requests per 15 minutes
export const studentLimiter = rateLimit({
  store: getStore(),
  windowMs: 15 * 60 * 1000,
  max: isDev ? 5000 : 100,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests, please try again later.' } }
});
