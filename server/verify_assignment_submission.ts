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

  const student = await prisma.student.findFirst({ where: { userid: user.userid } });
  if (!student) throw new Error('Student profile not found');

  // Find an assignment the student is enrolled in
  const enrollments = await prisma.courseenrollment.findMany({
    where: { studentid: student.studentid, isactive: true },
    include: { courseoffering: { include: { assignment: true } } }
  });
  
  let assignment = null;
  for (const en of enrollments) {
      if (en.courseoffering.assignment.length > 0) {
          assignment = en.courseoffering.assignment[0];
          break;
      }
  }

  if (!assignment) {
      console.log("Creating a mock assignment for testing...");
      const en = enrollments[0];
      assignment = await prisma.assignment.create({
          data: {
              courseofferingid: en.courseofferingid,
              title: "Test Assignment",
              maxmarks: 10,
              duedate: new Date(),
              isactive: true
          }
      });
  }

  const originalDueDate = assignment.duedate;

  try {
    // 1. Test Past Due
    await prisma.assignment.update({
      where: { assignmentid: assignment.assignmentid },
      data: { duedate: new Date(Date.now() - 100000000) } // past
    });

    console.log(`\n--- Test 1: Submit Past Due Date ---`);
    console.log(`POST /api/v1/student/assignments/${assignment.assignmentid}/submit`);
    
    let formData = new FormData();
    formData.append('file', new Blob(['test content'], { type: 'application/pdf' }), 'test.pdf');

    let res = await fetch(`http://localhost:5000/api/v1/student/assignments/${assignment.assignmentid}/submit`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData as any
    });
    console.log(`Status: ${res.status}`);
    console.log(await res.text());

    // 2. Test Before Due Date
    await prisma.assignment.update({
      where: { assignmentid: assignment.assignmentid },
      data: { duedate: new Date(Date.now() + 100000000) } // future
    });

    console.log(`\n--- Test 2: Submit Before Due Date ---`);
    console.log(`POST /api/v1/student/assignments/${assignment.assignmentid}/submit`);
    
    formData = new FormData();
    formData.append('file', new Blob(['test content'], { type: 'application/pdf' }), 'test.pdf');

    res = await fetch(`http://localhost:5000/api/v1/student/assignments/${assignment.assignmentid}/submit`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData as any
    });
    console.log(`Status: ${res.status}`);
    console.log(await res.text());

  } finally {
    // Revert
    await prisma.assignment.update({
      where: { assignmentid: assignment.assignmentid },
      data: { duedate: originalDueDate }
    });
    
    // Cleanup any created submission so it doesn't pollute DB
    await prisma.assignmentsubmission.deleteMany({
        where: { studentid: student.studentid, assignmentid: assignment.assignmentid }
    });

    await prisma.$disconnect();
  }
}

main().catch(console.error);
