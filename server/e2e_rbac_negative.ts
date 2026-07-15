import { PrismaClient } from '@prisma/client';
import supertest from 'supertest';
import app from './src/app.js';
import { generateAccessToken } from './src/utils/jwt.utils.js';

const prisma = new PrismaClient();

async function runTest() {
  // Update submission 6 to have a dummy fileUrl temporarily
  await prisma.assignmentsubmission.update({
    where: { assignmentsubmissionid: 6 },
    data: { fileUrl: 'dummy-file.pdf' }
  });

  // Check submission 6
  const sub = await prisma.assignmentsubmission.findUnique({
    where: { assignmentsubmissionid: 6 },
    include: {
      assignment: {
        include: {
          courseoffering: {
            include: { teachingassignment: { include: { teachingload: true } } }
          }
        }
      }
    }
  });

  if (!sub) {
    console.log('Submission 6 not found');
    return;
  }

  // 1. Authenticate as a DIFFERENT student
  const otherStudent = await prisma.student.findFirst({
    where: { studentid: { not: sub.studentid } },
    include: { user: true }
  });

  const studentTokenPayload = {
      userId: otherStudent.user.userid,
      email: otherStudent.user.email,
      role: otherStudent.user.role,
      roles: ['STUDENT'],
      version: otherStudent.user.version
  };
  const studentToken = generateAccessToken(studentTokenPayload);

  console.log('\n--- NEGATIVE TEST: DIFFERENT STUDENT ---');
  console.log('Student Email:', otherStudent.user.email);
  const studentRes = await supertest(app)
    .get('/api/v1/storage/assignments/' + sub.assignmentid + '/submissions/' + sub.assignmentsubmissionid + '/download')
    .set('Authorization', 'Bearer ' + studentToken);
  
  console.log('Status:', studentRes.status);
  console.log('Body:', studentRes.body);

  // 2. Authenticate as a DIFFERENT faculty
  const assignedFacultyIds = [sub.assignment.courseoffering.instructorid];
  sub.assignment.courseoffering.teachingassignment.forEach(ta => {
    assignedFacultyIds.push(ta.teachingload.facultyid);
  });

  const otherFaculty = await prisma.faculty.findFirst({
    where: { facultyid: { notIn: assignedFacultyIds.filter(id => id !== null) } },
    include: { user: true }
  });

  const facultyTokenPayload = {
      userId: otherFaculty.user.userid,
      email: otherFaculty.user.email,
      role: otherFaculty.user.role,
      roles: ['FACULTY'],
      version: otherFaculty.user.version
  };
  const facultyToken = generateAccessToken(facultyTokenPayload);

  console.log('\n--- NEGATIVE TEST: UNAUTHORIZED FACULTY ---');
  console.log('Faculty Email:', otherFaculty.user.email);
  const facultyRes = await supertest(app)
    .get('/api/v1/storage/assignments/' + sub.assignmentid + '/submissions/' + sub.assignmentsubmissionid + '/download')
    .set('Authorization', 'Bearer ' + facultyToken);

  console.log('Status:', facultyRes.status);
  console.log('Body:', facultyRes.body);

  // Revert
  await prisma.assignmentsubmission.update({
    where: { assignmentsubmissionid: 6 },
    data: { fileUrl: null }
  });
  
  await prisma.$disconnect();
}

runTest().catch(console.error);
