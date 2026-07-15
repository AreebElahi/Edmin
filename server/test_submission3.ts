import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { upsertAssignmentSubmission } from './src/models/student/assignments.model.js';

async function testSubmit() {
  const studentProfile = await prisma.student.findFirst();
  const assignment = await prisma.assignment.findFirst();
  
  if (!studentProfile || !assignment) return;

  const testUrl = 'uploads/assignments/test-file-' + Date.now() + '.pdf';
  console.log('Calling upsertAssignmentSubmission with fileUrl:', testUrl);
  
  await upsertAssignmentSubmission(studentProfile.studentid, assignment.assignmentid, testUrl);
  
  const submission = await prisma.assignmentsubmission.findFirst({
    where: { studentid: studentProfile.studentid, assignmentid: assignment.assignmentid }
  });
  
  console.log('Submission from DB:', submission);
  await prisma.$disconnect();
}

testSubmit().catch(console.error);
