import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function main() {
  const user: any = (await prisma.$queryRaw`SELECT userid, role FROM "user" WHERE email = 'student@edmin.com'`)[0];
  const token = jwt.sign(
    { userId: user.userid, role: user.role },
    process.env.JWT_ACCESS_SECRET || '4a99d31be959093a49ec32b5a12ea90d2a5d8f09020a60be4254ad44735ce90d',
    { expiresIn: '15m' }
  );

  const headers = { 'Authorization': `Bearer ${token}` };

  try {
    const res = await fetch(`http://127.0.0.1:5000/api/v1/dashboard/student`, {
      headers: headers
    });
    
    console.log(`GET /dashboard/student: ${res.status}`);
    const data = await res.json();
    console.log(JSON.stringify(data.data?.courses, null, 2));
  } catch (err: any) {
    console.error(err.message);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
