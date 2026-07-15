import { redisConnection } from './src/config/redis.js';

async function flush() {
  if(redisConnection && redisConnection.status !== 'ready') {
    await redisConnection.connect();
  }
  await redisConnection?.flushall();
  console.log('Redis flushed');
  process.exit(0);
}
flush();
