import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { submitAssignment } from './src/services/student/assignments.service.js';

async function testSubmit() {
  const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
  const assignment = await prisma.assignment.findFirst();
  if (!student || !assignment) {
    console.log('No student or assignment found');
    return;
  }

  const testUrl = 'uploads/assignments/test-file-' + Date.now() + '.pdf';
  console.log('Calling submitAssignment with fileUrl:', testUrl);
  
  await submitAssignment(student.userid, assignment.assignmentid, testUrl);
  
  const studentProfile = await prisma.student.findFirst({ where: { userid: student.userid } });
  
  const submission = await prisma.assignmentsubmission.findFirst({
    where: { studentid: studentProfile.studentid, assignmentid: assignment.assignmentid }
  });
  
  console.log('Submission from DB:', submission);
  await prisma.$disconnect();
}

testSubmit().catch(console.error);
