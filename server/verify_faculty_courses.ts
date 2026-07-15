import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function main() {
  const user: any = (await prisma.$queryRaw`SELECT userid, role, email FROM "user" WHERE role = 'FACULTY' LIMIT 1`)[0];
  if (!user) {
      console.log('No faculty user found');
      return;
  }
  
  console.log(`Using faculty user: ${user.email}`);

  const token = jwt.sign(
    { userId: user.userid, role: user.role },
    process.env.JWT_ACCESS_SECRET || '4a99d31be959093a49ec32b5a12ea90d2a5d8f09020a60be4254ad44735ce90d',
    { expiresIn: '15m' }
  );

  console.log(`\n--- Fetching /api/v1/faculty/courses ---`);
  let res = await fetch(`http://localhost:5000/api/v1/faculty/courses`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const text = await res.text();
  console.log('Status:', res.status);
  console.log(text);

  await prisma.$disconnect();
}

main().catch(console.error);
