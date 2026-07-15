import { createClient } from 'redis';

async function flush() {
    const client = createClient();
    await client.connect();
    await client.flushAll();
    console.log('Redis flushed');
    await client.disconnect();
}

flush();
