import IORedis from 'ioredis';

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
