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

  const enrollment = await prisma.courseenrollment.findFirst({ where: { student: { userid: user.userid } }});
  
  let assignment = await prisma.assignment.findFirst({
    where: { duedate: { gt: new Date() }, courseofferingid: enrollment!.courseofferingid }
  });
  if (!assignment) {
    assignment = await prisma.assignment.create({
      data: {
        title: 'Test Assignment',
        courseofferingid: enrollment!.courseofferingid,
        duedate: new Date(Date.now() + 86400000), // tomorrow
        maxmarks: 100,
      }
    });
  }

  const filesToTest = [
    { name: 'test.txt', type: 'text/plain', content: 'hello text' },
    { name: 'test.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', content: 'fake docx' },
    { name: 'test.zip', type: 'application/zip', content: 'fake zip' },
    { name: 'test.png', type: 'image/png', content: 'fake png' },
    { name: 'test.pdf', type: 'application/pdf', content: 'fake pdf' },
  ];

  for (const fileInfo of filesToTest) {
    const formData = new FormData();
    const blob = new Blob([fileInfo.content], { type: fileInfo.type });
    formData.append('file', blob as any, fileInfo.name);

    const res = await fetch(`http://localhost:5000/api/v1/student/assignments/${assignment.assignmentid}/submit`, {
      method: 'POST',
      headers: headers,
      body: formData as any
    });
    
    console.log(`POST submit ${fileInfo.name}: ${res.status}`);
    console.log('Response:', await res.text());
  }

  await prisma.$disconnect();
}

main().catch(console.error);
