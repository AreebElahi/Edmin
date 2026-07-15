import { redisConnection } from './src/config/redis.js';

async function main() {
    if (redisConnection && redisConnection.status === 'ready') {
        await redisConnection.flushdb();
        console.log('Successfully flushed Redis');
    } else {
        console.log('Redis is not ready or not connected');
    }
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
