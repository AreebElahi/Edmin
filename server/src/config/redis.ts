import IORedis from 'ioredis';
import { Response } from 'express';

// ESM compatible class extraction
const RedisClass = (IORedis as unknown as { default: typeof IORedis }).default || IORedis;

/**
 * Creates a standard ESM-safe Redis client instance.
 * @param url Redis connection string
 * @param options ioredis options
 */
export const createRedisClient = (url: string, options?: any) => {
  const client = new (RedisClass as any)(url, options);
  client.on('error', (err: any) => {
    // Avoid crashing or noisy stack traces in local development
    console.warn(`[Redis Client Warning] Redis connection issue: ${err.message}`);
  });
  return client;
};

// Singleton export if configured locally
export const redisConnection = process.env.REDIS_URL
  ? createRedisClient(process.env.REDIS_URL, { maxRetriesPerRequest: null })
  : null;

/**
 * Enterprise Cache Stampede Protection (Mutex)
 * Acquires a distributed lock using SETNX.
 */
export const acquireLock = async (key: string, ttlSeconds: number = 5): Promise<boolean> => {
  if (!redisConnection || redisConnection.status !== 'ready') return false;
  const lockKey = `lock:${key}`;
  const acquired = await redisConnection.set(lockKey, 'locked', 'EX', ttlSeconds, 'NX');
  return acquired === 'OK';
};

/**
 * Releases a distributed lock.
 */
export const releaseLock = async (key: string): Promise<void> => {
  if (!redisConnection || redisConnection.status !== 'ready') return;
  const lockKey = `lock:${key}`;
  await redisConnection.del(lockKey);
};

/**
 * Check cache and send directly to avoid JSON parse/stringify overhead.
 */
export const getCachedResponse = async (key: string, res: Response): Promise<boolean> => {
  if (!redisConnection || redisConnection.status !== 'ready') return false;
  try {
    const cached = await redisConnection.get(key);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      res.status(200).send(cached);
      return true;
    }
  } catch (err) {
    console.warn(`Cache read error: ${err}`);
  }
  return false;
};

/**
 * Cache data wrapped in the standardized response envelope.
 */
export const setCachedResponse = async (key: string, data: any, ttlSeconds: number = 60, meta: any = {}): Promise<void> => {
  if (!redisConnection || redisConnection.status !== 'ready') return;
  try {
    const payload = JSON.stringify({
      success: true,
      message: 'Operation completed successfully.',
      data,
      meta: meta || {},
      timestamp: new Date().toISOString()
    });
    await redisConnection.setex(key, ttlSeconds, payload);
  } catch (err) {
    console.warn(`Cache write error: ${err}`);
  }
};

/**
 * Delete exact cache keys (e.g. ['api:admin:departments', 'api:faculty:teaching-loads'])
 */
export const invalidateExact = async (keys: string[]): Promise<void> => {
  if (!redisConnection || redisConnection.status !== 'ready' || keys.length === 0) return;
  try {
    await redisConnection.del(...keys);
  } catch (err) {
    console.warn(`Cache invalidation error: ${err}`);
  }
};
