import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function main() {
  // Find a faculty user who actually has course offerings assigned
  const facultyWithCourse = await prisma.faculty.findFirst({
      where: {
          courseoffering: { some: {} }
      },
      include: { user: true }
  });

  const facultyWithLoad = await prisma.faculty.findFirst({
      where: {
          teachingload: { some: {} }
      },
      include: { user: true }
  });

  let targetFaculty = facultyWithCourse || facultyWithLoad;
  if (!targetFaculty) {
    targetFaculty = await prisma.faculty.findFirst({ include: { user: true }});
    if (targetFaculty) {
      await prisma.courseoffering.update({
        where: { courseofferingid: 1 },
        data: {
           facultyid: targetFaculty.facultyid
        }
      });
    }
  }

  if (!targetFaculty || !targetFaculty.user) {
      console.log('No faculty user found.');
      return;
  }
  
  console.log(`Using faculty user: ${targetFaculty.user.email}`);

  const token = jwt.sign(
    { userId: targetFaculty.user.userid, role: targetFaculty.user.role },
    process.env.JWT_ACCESS_SECRET || '4a99d31be959093a49ec32b5a12ea90d2a5d8f09020a60be4254ad44735ce90d',
    { expiresIn: '15m' }
  );

  console.log(`\n--- Fetching /api/v1/faculty/courses ---`);
  let res = await fetch(`http://localhost:5000/api/v1/faculty/courses`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(await res.text());

  console.log(`\n--- Fetching /api/v1/faculty/teaching-loads/available-courses ---`);
  res = await fetch(`http://localhost:5000/api/v1/faculty/teaching-loads/available-courses`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(await res.text());

  console.log(`\n--- Fetching /api/v1/faculty/approvals ---`);
  res = await fetch(`http://localhost:5000/api/v1/faculty/approvals`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(await res.text());

  await prisma.$disconnect();
}

main().catch(console.error);
