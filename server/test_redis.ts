import 'dotenv/config';
import { redisConnection } from './src/config/redis.js';

async function main() {
  if (redisConnection && redisConnection.status === 'ready') {
    const val = await redisConnection.get('api:student:quizzes:3');
    console.log('Type of val:', typeof val);
    console.log('Val:', val);
  }
  process.exit(0);
}

setTimeout(main, 1000);
