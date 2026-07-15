import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function main() {
  const studentUser: any = (await prisma.$queryRaw`SELECT userid, role FROM "user" WHERE email = 'student@edmin.com'`)[0];
  const studentToken = jwt.sign(
    { userId: studentUser.userid, id: studentUser.userid, role: studentUser.role },
    process.env.JWT_ACCESS_SECRET || '4a99d31be959093a49ec32b5a12ea90d2a5d8f09020a60be4254ad44735ce90d',
    { expiresIn: '15m' }
  );

  const studentProfile: any = (await prisma.$queryRaw`SELECT studentid FROM student WHERE userid = ${studentUser.userid}`)[0];
  const offering: any = (await prisma.$queryRaw`
    SELECT co.courseofferingid, co.facultyid
    FROM courseoffering co 
    JOIN courseenrollment ce ON co.courseofferingid = ce.courseofferingid 
    WHERE ce.studentid = ${studentProfile.studentid}
    LIMIT 1
  `)[0];

  const facultyUser: any = (await prisma.$queryRaw`
    SELECT userid, role 
    FROM "user" 
    WHERE userid = (SELECT userid FROM faculty WHERE facultyid = ${offering.facultyid})
  `)[0];
  const facultyToken = jwt.sign(
    { userId: facultyUser.userid, id: facultyUser.userid, role: facultyUser.role },
    process.env.JWT_ACCESS_SECRET || '4a99d31be959093a49ec32b5a12ea90d2a5d8f09020a60be4254ad44735ce90d',
    { expiresIn: '15m' }
  );

  const courseOfferingId = offering.courseofferingid;

  // 1. Faculty creates a draft quiz
  console.log('--- 1. FACULTY CREATES DRAFT QUIZ ---');
  const quizPayload = {
    title: 'E2E Test Quiz ' + Date.now(),
    description: 'A test quiz',
    facultyid: facultyUser.userid, // Needs actual faculty ID, let's look it up
    courseOfferingId: courseOfferingId,
    difficulty: 'EASY',
    questiontype: 'MCQ',
    questioncount: 1,
    timeLimitMinutes: 10,
    maxWarnings: 3,
    status: 'DRAFT',
    questions: [
      {
        questiontext: 'What is 2+2?',
        options: JSON.stringify(['3', '4', '5', '6']),
        correctanswer: '4',
        explanation: 'Math'
      }
    ]
  };
  
  // Actually, saving quiz uses `POST /ai-quiz/save`
  const createRes = await fetch(`http://localhost:5000/api/v1/ai-quiz/save`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${facultyToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(quizPayload)
  });
  console.log(`POST /ai-quiz/save -> Status: ${createRes.status}`);
  const createData = await createRes.json();
  console.log('Save response:', createData);
  const quizId = createData.data?.aiquizid;
  console.log('Quiz ID:', quizId);

  console.log('\n--- 2. FACULTY PUBLISHES QUIZ ---');
  const publishRes = await fetch(`http://localhost:5000/api/v1/ai-quiz/${quizId}/status`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${facultyToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status: 'PUBLISHED' })
  });
  console.log(`PUT /ai-quiz/${quizId}/status -> Status: ${publishRes.status}`);
  
  // wait a moment for the async event subscriber to finish
  await new Promise(r => setTimeout(r, 1000));

  console.log('\n--- 3. CHECK DB FOR NOTIFICATION ---');
  const notifications = await prisma.notification.findMany({
    where: { userid: studentUser.userid, title: 'New Quiz Available' },
    orderBy: { createdat: 'desc' },
    take: 1
  });
  console.log('Latest DB Notification:', JSON.stringify(notifications, null, 2));

  console.log('\n--- 4. STUDENT FETCHES NOTIFICATIONS ---');
  const { redisConnection } = await import('./src/config/redis.js');
  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del(`api:student:notifications:${studentUser.userid}`);
  }

  const notifRes = await fetch(`http://localhost:5000/api/v1/notifications?limit=5`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  console.log(`GET /notifications -> Status: ${notifRes.status}`);
  const notifData = await notifRes.json();
  console.log('Response:', JSON.stringify(notifData, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
