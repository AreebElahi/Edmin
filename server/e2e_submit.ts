import { PrismaClient } from '@prisma/client';
import supertest from 'supertest';
import app from './src/app.js';
import * as fs from 'fs';
import * as path from 'path';
import { generateAccessToken } from './src/utils/jwt.utils.js';

const prisma = new PrismaClient();

async function runE2E() {
  const enrollment = await prisma.courseenrollment.findFirst({
    where: { isactive: true },
    include: {
      student: { include: { user: true } },
      courseoffering: { include: { assignment: true } }
    }
  });
  
  if (!enrollment || !enrollment.courseoffering.assignment.length) {
    console.log('No valid enrollment with assignments found.');
    return;
  }

  const studentUser = enrollment.student.user;
  const assignmentId = enrollment.courseoffering.assignment[0].assignmentid;
  
  console.log('Testing with student ' + studentUser.email + ' for assignment ' + assignmentId);

  // Log in using generateAccessToken
  const tokenPayload = {
      userId: studentUser.userid,
      email: studentUser.email,
      role: studentUser.role,
      roles: ['STUDENT'],
      version: studentUser.version
  };
  const token = generateAccessToken(tokenPayload);

  // Create a dummy file
  const testPdfPath = path.join(process.cwd(), 'test-e2e-upload.pdf');
  fs.writeFileSync(testPdfPath, '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Submit assignment
  const submitRes = await supertest(app)
    .post('/api/v1/student/assignments/' + assignmentId + '/submit')
    .set('Authorization', 'Bearer ' + token)
    .attach('file', testPdfPath);
    
  console.log('Submit Response Status:', submitRes.status);
  console.log('Submit Response Body:', submitRes.body);

  if (submitRes.status === 201 || submitRes.status === 200) {
    const submission = await prisma.assignmentsubmission.findFirst({
      where: {
        studentid: enrollment.studentid,
        assignmentid: assignmentId
      },
      orderBy: { updatedat: 'desc' }
    });
    console.log('Submission in DB:', submission);
  }
  
  fs.unlinkSync(testPdfPath);
  await prisma.$disconnect();
}

runE2E().catch(console.error);
