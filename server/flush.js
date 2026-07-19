import Redis from 'ioredis';
const redis = new Redis();
redis.flushall().then(() => { console.log('Redis flushed'); process.exit(0); });
