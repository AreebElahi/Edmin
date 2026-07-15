import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function main() {
  const studentUser: any = (await prisma.$queryRaw`SELECT userid, role FROM "user" WHERE email = 'student@edmin.com'`)[0];
  const studentToken = jwt.sign(
    { userId: studentUser.userid, role: studentUser.role },
    process.env.JWT_ACCESS_SECRET || '4a99d31be959093a49ec32b5a12ea90d2a5d8f09020a60be4254ad44735ce90d',
    { expiresIn: '15m' }
  );

  const { redisConnection } = await import('./src/config/redis.js');
  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del(`api:student:notifications:${studentUser.userid}`);
    console.log('Cache cleared for user', studentUser.userid);
  }

  console.log('\n--- FETCH NOTIFICATIONS ---');
  const notifRes = await fetch(`http://localhost:5000/api/v1/notifications`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  console.log(`GET /notifications -> Status: ${notifRes.status}`);
  const notifData = await notifRes.json();
  console.log('Response:', JSON.stringify(notifData, null, 2));

  await prisma.$disconnect();
  process.exit(0);
}

// wait for redis to be ready
setTimeout(() => main().catch(console.error), 1000);
