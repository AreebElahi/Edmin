import { PrismaClient } from '@prisma/client';
import supertest from 'supertest';
import app from './src/app.js';
import * as fs from 'fs';
import * as path from 'path';
import { generateAccessToken } from './src/utils/jwt.utils.js';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

async function runE2E() {
  const enrollment = await prisma.courseenrollment.findFirst({
    where: { isactive: true },
    include: {
      student: { include: { user: true } },
      courseoffering: { 
        include: { 
          assignment: {
            where: { isactive: true }
          } 
        } 
      }
    }
  });
  
  if (!enrollment || !enrollment.courseoffering.assignment.length) {
    console.log('No valid enrollment with active assignments found.');
    return;
  }

  const studentUser = enrollment.student.user;
  const assignmentId = enrollment.courseoffering.assignment[0].assignmentid;
  
  // Make sure due date is in the future
  await prisma.assignment.update({
    where: { assignmentid: assignmentId },
    data: { duedate: new Date(Date.now() + 86400000) }
  });
  
  console.log('Testing with student ' + studentUser.email + ' for assignment ' + assignmentId);

  // Log in
  const tokenPayload = {
      userId: studentUser.userid,
      email: studentUser.email,
      role: studentUser.role,
      roles: ['STUDENT'],
      version: studentUser.version
  };
  const token = generateAccessToken(tokenPayload);

  // 1. Submit assignment
  const testPdfPath = path.join(process.cwd(), 'test-supabase-upload.pdf');
  const pdfContent = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  fs.writeFileSync(testPdfPath, pdfContent);

  console.log('-> Submitting assignment...');
  const submitRes = await supertest(app)
    .post('/api/v1/student/assignments/' + assignmentId + '/submit')
    .set('Authorization', 'Bearer ' + token)
    .attach('file', testPdfPath);
    
  console.log('Submit Response Status:', submitRes.status);
  
  if (submitRes.status !== 201 && submitRes.status !== 200) {
    console.error('Submit failed:', submitRes.body);
    return;
  }

  const submissionId = submitRes.body.data.assignmentsubmissionid;
  console.log('Submission DB ID:', submissionId);
  console.log('Submission DB fileUrl:', submitRes.body.data.fileUrl);

  // 2. Test fetching assignment details (should have downloadUrl)
  console.log('-> Fetching assignment details...');
  const detailRes = await supertest(app)
    .get('/api/v1/student/assignments/' + assignmentId)
    .set('Authorization', 'Bearer ' + token);
    
  console.log('Detail Response Status:', detailRes.status);
  const downloadUrl = detailRes.body.data.submission.downloadUrl;
  console.log('Download URL in details:', downloadUrl);
  
  if (!downloadUrl) {
    console.error('Missing downloadUrl in assignment details!');
    return;
  }

  // 3. Test download endpoint
  console.log('-> Requesting secure download link...');
  const downloadRes = await supertest(app)
    .get(downloadUrl)
    .set('Authorization', 'Bearer ' + token);
    
  console.log('Download Endpoint Status:', downloadRes.status);
  console.log('Download Endpoint Body:', downloadRes.body);
  
  if (downloadRes.status !== 200) {
    console.error('Download endpoint failed!');
    return;
  }
  
  const signedUrl = downloadRes.body.url;
  
  // 4. Fetch the signed URL to verify it works
  console.log('-> Fetching from signed URL directly...');
  const fileRes = await fetch(signedUrl);
  console.log('Signed URL HTTP Status:', fileRes.status);
  
  const fileBuffer = await fileRes.buffer();
  console.log('Downloaded File Length:', fileBuffer.length, 'bytes');
  console.log('Original File Length:', Buffer.from(pdfContent).length, 'bytes');
  
  fs.unlinkSync(testPdfPath);
  await prisma.$disconnect();
  console.log('E2E Test Complete!');
}

runE2E().catch(console.error);
