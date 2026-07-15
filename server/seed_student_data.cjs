const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
  if (!user) return console.log('No student user found');

  let student = await prisma.student.findFirst({ where: { userid: user.userid } });
  if (!student) {
    student = await prisma.student.create({
      data: {
        userid: user.userid,
        fullname: 'Jane Student',
        enrollmentnumber: 'ENR-1001',
        major: 'Computer Science',
        isactive: true
      }
    });
    console.log('Created student profile');
  }

  const courseCount = await prisma.course.count();
  if (courseCount === 0) {
    const course = await prisma.course.create({
      data: {
        code: 'CS101',
        name: 'Intro to Computer Science',
        description: 'Basics of CS',
        credits: 3,
        isactive: true
      }
    });
    
    // need a faculty
    let facUser = await prisma.user.findFirst({ where: { role: 'FACULTY' } });
    let faculty = await prisma.faculty.findFirst({ where: { userid: facUser.userid } });
    if (!faculty) {
      faculty = await prisma.faculty.create({
        data: {
          userid: facUser.userid,
          fullname: 'Dr. John Doe',
          designation: 'Professor',
          hiredate: new Date(),
          isactive: true
        }
      });
    }

    const offering = await prisma.courseoffering.create({
      data: {
        courseid: course.courseid,
        term: 'Fall 2026',
        year: 2026,
        capacity: 50,
        facultyid: faculty.facultyid,
        isactive: true
      }
    });

    await prisma.courseenrollment.create({
      data: {
        studentid: student.studentid,
        offeringid: offering.offeringid,
        status: 'ENROLLED',
        isactive: true
      }
    });

    await prisma.assignment.create({
      data: {
        offeringid: offering.offeringid,
        title: 'Assignment 1',
        description: 'First assignment',
        duedate: new Date(Date.now() + 86400000 * 7),
        maxscore: 100,
        isactive: true,
        createdbyid: facUser.userid
      }
    });

    await prisma.quiz.create({
      data: {
        offeringid: offering.offeringid,
        title: 'Quiz 1',
        description: 'First quiz',
        createdbyid: facUser.userid,
        isactive: true
      }
    });
    console.log('Seeded course, offering, enrollment, assignment, quiz');
  }
}

main().then(() => prisma.$disconnect());
