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

  // GET schedule
  const startSchedule = performance.now();
  let res = await fetch(`http://localhost:5000/api/v1/student/schedule`, { headers });
  const endSchedule = performance.now();
  console.log(`GET /student/schedule: ${res.status} in ${(endSchedule - startSchedule).toFixed(2)}ms`);

  // POST enrollment
  const startEnrollment = performance.now();
  res = await fetch(`http://localhost:5000/api/v1/student/enrollment`, { 
    method: 'POST', 
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ courseOfferingId: 1 })
  });
  const endEnrollment = performance.now();
  console.log(`POST /student/enrollment: ${res.status} in ${(endEnrollment - startEnrollment).toFixed(2)}ms`);
  console.log('Enrollment response:', await res.text());

  // Find or create an assignment that is NOT past its deadline
  let assignment = await prisma.assignment.findFirst({
    where: { duedate: { gt: new Date() } }
  });
  if (!assignment) {
    const course = await prisma.courseoffering.findFirst();
    assignment = await prisma.assignment.create({
      data: {
        title: 'Test Assignment',
        courseofferingid: course!.courseofferingid,
        duedate: new Date(Date.now() + 86400000), // tomorrow
        maxmarks: 100,
      }
    });
  }

  const formData = new FormData();
  const blob = new Blob(['test file content'], { type: 'text/plain' });
  formData.append('file', blob as any, 'test.txt');

  const startAssignment = performance.now();
  res = await fetch(`http://localhost:5000/api/v1/student/assignments/${assignment.assignmentid}/submit`, {
    method: 'POST',
    headers: headers,
    body: formData as any
  });
  const endAssignment = performance.now();
  console.log(`POST /student/assignments/${assignment.assignmentid}/submit: ${res.status} in ${(endAssignment - startAssignment).toFixed(2)}ms`);
  console.log('Assignment response:', await res.text());

  await prisma.$disconnect();
}

main().catch(console.error);
