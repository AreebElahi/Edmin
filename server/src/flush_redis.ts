import { redisConnection } from './config/redis.js';
async function flush() {
  if (redisConnection) {
    await redisConnection.flushall();
    console.log("Redis flushed");
    process.exit(0);
  }
}
flush();
