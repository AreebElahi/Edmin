import IORedis from 'ioredis';

async function flushRbac() {
  console.log('--- SCAN-BASED RBAC CACHE INVALIDATION ---');
  const redisConnection = new IORedis('redis://localhost:6379');
  
  let cursor = '0';
  let deletedCount = 0;
  do {
    const [nextCursor, keys] = await redisConnection.scan(cursor, 'MATCH', 'RBAC:STATIC:*', 'COUNT', 100);
    cursor = nextCursor;
    if (keys.length > 0) {
      await redisConnection.del(...keys);
      deletedCount += keys.length;
    }
  } while (cursor !== '0');
  
  console.log(`Successfully invalidated ${deletedCount} RBAC cache entries.`);
  process.exit(0);
}

flushRbac().catch(console.error);
