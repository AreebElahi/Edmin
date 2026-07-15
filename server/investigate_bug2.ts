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

  console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Not Set');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not Set');

  const sub = await prisma.assignmentsubmission.findFirst({
      where: { fileUrl: { not: null } }
  });

  if (!sub) {
      console.log('No submission with a fileurl found in db');
      return;
  }

  console.log(`Found submission: ID ${sub.assignmentsubmissionid}, fileurl: ${sub.fileUrl}`);

  console.log(`\n--- Fetching /api/v1/storage/assignments/${sub.assignmentid}/submissions/${sub.assignmentsubmissionid}/download ---`);
  let res = await fetch(`http://localhost:5000/api/v1/storage/assignments/${sub.assignmentid}/submissions/${sub.assignmentsubmissionid}/download`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(`Status: ${res.status}`);
  console.log(await res.text());

  await prisma.$disconnect();
}

main().catch(console.error);
