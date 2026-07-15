import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function main() {
  const user: any = (await prisma.$queryRaw`SELECT userid, role FROM "user" WHERE email = 'student@edmin.com'`)[0];
  if (!user) throw new Error('Student user not found');
  
  const token = jwt.sign(
    { userId: user.userid, role: user.role },
    process.env.JWT_ACCESS_SECRET || '4a99d31be959093a49ec32b5a12ea90d2a5d8f09020a60be4254ad44735ce90d',
    { expiresIn: '15m' }
  );

  const res = await fetch(`http://localhost:5000/api/v1/student/attendance`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  console.log(`HTTP Response: ${res.status}`);
  console.log(JSON.stringify(await res.json(), null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
