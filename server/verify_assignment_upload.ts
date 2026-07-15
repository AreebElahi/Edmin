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

  const student: any = (await prisma.$queryRaw`SELECT studentid FROM student WHERE userid = ${user.userid}`)[0];
  const assignment: any = (await prisma.$queryRaw`
    SELECT a.assignmentid 
    FROM assignment a 
    JOIN courseenrollment ce ON a.courseofferingid = ce.courseofferingid 
    WHERE ce.studentid = ${student.studentid}
    LIMIT 1
  `)[0];
  if (!assignment) {
    console.log("No assignments found");
    process.exit(1);
  }
  const assignmentId = assignment.assignmentid;

  // Extend deadline to tomorrow
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 1);
  await prisma.$executeRaw`UPDATE assignment SET duedate = ${futureDate} WHERE assignmentid = ${assignmentId}`;

  const files = [
    { name: 'test.txt', type: 'text/plain', content: 'Hello World' },
    { name: 'test.zip', type: 'application/zip', content: 'PK\x03\x04\x14\x00\x00\x00\x08\x00\x00\x00!\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00' },
    { name: 'test.png', type: 'image/png', content: '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDAT\x08\xd7c\xf8\xff\xff?\x00\x05\xfe\x02\xfe\xa75\x81\x84\x00\x00\x00\x00IEND\xaeB`\x82' }
  ];

  for (const f of files) {
    const formData = new FormData();
    const blob = new Blob([f.content], { type: f.type });
    formData.append('file', blob, f.name);

    try {
      const res = await fetch(`http://localhost:5000/api/v1/student/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json().catch(() => null) || await res.text();
      console.log(`Submitted ${f.name} -> Status: ${res.status}`);
      console.log('Response:', data);
    } catch (e: any) {
      console.log(`Failed ${f.name}:`, e.message);
    }
  }

  await prisma.$disconnect();
}
main();
