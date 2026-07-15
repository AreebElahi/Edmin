import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { submitAssignment } from './src/services/student/assignments.service.js';

async function testSubmit() {
  const enrollment = await prisma.courseenrollment.findFirst({
    include: {
      student: { include: { user: true } },
      courseoffering: { include: { assignment: true } }
    }
  });
  
  if (!enrollment || !enrollment.courseoffering.assignment.length) {
    console.log('No valid enrollment with assignments found.');
    return;
  }
  
  const studentUserId = enrollment.student.userid;
  const assignmentId = enrollment.courseoffering.assignment[0].assignmentid;

  const testUrl = 'uploads/assignments/test-file-' + Date.now() + '.pdf';
  console.log('Calling submitAssignment with fileUrl:', testUrl);
  
  await submitAssignment(studentUserId, assignmentId, testUrl);
  
  const submission = await prisma.assignmentsubmission.findFirst({
    where: { studentid: enrollment.studentid, assignmentid: assignmentId }
  });
  
  console.log('Submission from DB:', submission);
  await prisma.$disconnect();
}

testSubmit().catch(console.error);
