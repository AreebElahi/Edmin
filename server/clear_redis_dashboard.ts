import 'dotenv/config';
import { redisConnection } from './src/config/redis.js';

async function main() {
  if (redisConnection && redisConnection.status === 'ready') {
    const keys = await redisConnection.keys('RBAC:STATIC:*');
    if (keys.length > 0) {
      console.log('Clearing Redis keys:', keys);
      await redisConnection.del(keys);
    } else {
      console.log('No dashboard cache keys found.');
    }
  } else {
    console.log('Redis connection not ready.');
  }
  process.exit(0);
}

// wait for ready
setTimeout(main, 1000);
