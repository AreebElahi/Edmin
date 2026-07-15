const { Client } = require('pg');

async function test(port) {
    const client = new Client({
        connectionString: `postgresql://postgres.obrfkhndqlrjfgngjuyt:Muneeburrehman21@aws-1-ap-south-1.pooler.supabase.com:${port}/postgres`
    });

    try {
        await client.connect();
        console.log(`Connected successfully on port ${port}!`);
        await client.end();
    } catch (err) {
        console.error(`Connection failed on port ${port}:`, err.message);
    }
}

test(5432).then(() => test(6543));
