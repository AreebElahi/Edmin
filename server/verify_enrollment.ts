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

  // Find a course offering the student IS enrolled in
  const enrolled = await prisma.courseenrollment.findFirst({
      where: { studentid: student.studentid, status: 'ENROLLED' }
  });

  if (enrolled) {
      console.log(`\n--- POST /student/enrollment (Already Enrolled) ---`);
      let res = await fetch(`http://localhost:5000/api/v1/student/enrollment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ courseOfferingId: enrolled.courseofferingid })
      });
      console.log(`Status: ${res.status}`);
      console.log(await res.text());
  }

  let notEnrolled = await prisma.courseoffering.findFirst({
      where: {
          courseenrollment: {
              none: { studentid: student.studentid }
          }
      }
  });

  if (!notEnrolled) {
      const course = await prisma.course.findFirst();
      const semester = await prisma.semester.findFirst();
      notEnrolled = await prisma.courseoffering.create({
          data: { course: { connect: { courseid: course.courseid } }, department: { connect: { departmentid: course.departmentid } }, semester: { connect: { semesterid: semester.semesterid } }, status: 'ACTIVE', capacity: 30 }
      });
  }

  if (notEnrolled) {
      if (notEnrolled.status !== 'ACTIVE') {
          await prisma.courseoffering.update({
              where: { courseofferingid: notEnrolled.courseofferingid },
              data: { status: 'ACTIVE' }
          });
      }
      // Delete any pending requests for this offering and student
      await prisma.enrollmentrequest.deleteMany({
          where: { studentid: student.studentid, courseofferingid: notEnrolled.courseofferingid }
      });
  }

  if (notEnrolled) {
      console.log(`\n--- POST /student/enrollment (Valid, Not Enrolled) ---`);
      let res = await fetch(`http://localhost:5000/api/v1/student/enrollment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ courseOfferingId: notEnrolled.courseofferingid })
      });
      console.log(`Status: ${res.status}`);
      console.log(await res.text());
  }

  await prisma.$disconnect();
}

main().catch(console.error);
