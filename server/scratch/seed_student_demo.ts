import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const courseOfferingId = 1;
  const studentId = 1;
  const userId = 3;

  console.log('Seeding student demo data...');

  // 1. Create an Assignment
  const assignment1 = await prisma.assignment.create({
    data: {
      courseofferingid: courseOfferingId,
      title: 'Final Project Submission',
      duedate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // Next week
      maxmarks: 100,
      isactive: true,
    }
  });

  // 2. Create an Assignment Submission (PENDING)
  await prisma.assignmentsubmission.create({
    data: {
      assignmentid: assignment1.assignmentid,
      studentid: studentId,
      status: 'SUBMITTED',
      isactive: true,
    }
  });

  // 3. Create a Quiz
  const quiz1 = await prisma.quiz.create({
    data: {
      courseofferingid: courseOfferingId,
      title: 'Midterm Assessment',
      duration: 60,
      totalmarks: 50,
      isactive: true,
    }
  });

  // 4. Create a Quiz Attempt
  await prisma.quizattempt.create({
    data: {
      quizid: quiz1.quizid,
      studentid: studentId,
      score: 45,
      isactive: true,
      startedat: new Date(),
      submittedat: new Date(),
    }
  });

  // 5. Create Course Grade
  await prisma.coursegrade.create({
    data: {
      courseofferingid: courseOfferingId,
      studentid: studentId,
      gpa: 3.8,
      grade: 'A',
      isactive: true,
    }
  });

  // 6. Create Notifications
  await prisma.notification.create({
    data: {
      userid: userId,
      title: 'New Assignment Posted',
      message: 'A new assignment "Final Project Submission" has been posted in Intro to Computer Science.',
      type: 'ACADEMIC',
      isread: false,
      isactive: true,
    }
  });

  await prisma.notification.create({
    data: {
      userid: userId,
      title: 'Grade Updated',
      message: 'Your midterm grade has been published.',
      type: 'ACADEMIC',
      isread: false,
      isactive: true,
    }
  });

  // 7. Create Class Sessions & Attendance
  const session1 = await prisma.classsession.create({
    data: {
      courseofferingid: courseOfferingId,
      sessiondate: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      topic: 'Introduction to Algorithms',
      status: 'COMPLETED',
      isactive: true,
    }
  });

  await prisma.attendance.create({
    data: {
      sessionid: session1.classsessionid,
      studentid: studentId,
      status: 'PRESENT',
      isactive: true,
    }
  });

  console.log('Successfully seeded student demo data!');
  await prisma.$disconnect();
}

main().catch(console.error);
