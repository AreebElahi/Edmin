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

  const facultyUser: any = (await prisma.$queryRaw`SELECT userid, role FROM "user" WHERE role = 'FACULTY' LIMIT 1`)[0];
  const facultyToken = jwt.sign(
    { userId: facultyUser.userid, role: facultyUser.role },
    process.env.JWT_ACCESS_SECRET || '4a99d31be959093a49ec32b5a12ea90d2a5d8f09020a60be4254ad44735ce90d',
    { expiresIn: '15m' }
  );

  // Get a courseoffering the student is enrolled in
  const studentProfile: any = (await prisma.$queryRaw`SELECT studentid FROM student WHERE userid = ${studentUser.userid}`)[0];
  const offering: any = (await prisma.$queryRaw`
    SELECT co.courseofferingid 
    FROM courseoffering co 
    JOIN courseenrollment ce ON co.courseofferingid = ce.courseofferingid 
    WHERE ce.studentid = ${studentProfile.studentid}
    LIMIT 1
  `)[0];

  const courseOfferingId = offering.courseofferingid;

  console.log('--- 1. FACULTY CREATES ASSIGNMENT ---');
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);
  const payload = {
    courseOfferingId: String(courseOfferingId),
    title: 'E2E Test Assignment ' + Date.now(),
    maxMarks: '100',
    dueDate: futureDate.toISOString()
  };

  const createRes = await fetch(`http://localhost:5000/api/v1/faculty/assignments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${facultyToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  console.log(`POST /faculty/assignments -> Status: ${createRes.status}`);
  const createData = await createRes.json();
  console.log('Response:', JSON.stringify(createData, null, 2));

  // wait a moment for the async event subscriber to finish
  await new Promise(r => setTimeout(r, 1000));

  console.log('\n--- 2. CHECK DB FOR NOTIFICATION ---');
  const notifications = await prisma.notification.findMany({
    where: { userid: studentUser.userid, title: 'New Assignment Published' },
    orderBy: { createdat: 'desc' },
    take: 1
  });
  console.log('Latest DB Notification:', JSON.stringify(notifications, null, 2));

  console.log('\n--- 3. STUDENT FETCHES NOTIFICATIONS ---');
  const notifRes = await fetch(`http://localhost:5000/api/v1/notifications?limit=5`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  console.log(`GET /notifications -> Status: ${notifRes.status}`);
  const notifData = await notifRes.json();
  console.log('Response:', JSON.stringify(notifData, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
