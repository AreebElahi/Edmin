import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const courseOfferingId = 1;
  const facultyId = 1;
  const userId = 1;

  console.log('Seeding faculty demo data...');

  // 1. Create Notifications for Faculty
  await prisma.notification.create({
    data: {
      userid: userId,
      title: 'New Assignment Submission',
      message: 'Alice Student has submitted "Final Project Submission".',
      type: 'ACADEMIC',
      isread: false,
      isactive: true,
    }
  });

  await prisma.notification.create({
    data: {
      userid: userId,
      title: 'Course Enrollment Request',
      message: 'You have 1 pending enrollment request for Intro to Computer Science.',
      type: 'ADMINISTRATIVE',
      isread: false,
      isactive: true,
    }
  });

  // 2. Create a Leave Request for the Faculty
  await prisma.leaverequest.create({
    data: {
      userid: userId,
      startdate: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000), // In 2 weeks
      enddate: new Date(new Date().getTime() + 16 * 24 * 60 * 60 * 1000), // For 3 days
      reason: 'Attending an academic conference.',
      leavetype: 'CASUAL',
      status: 'PENDING',
      isactive: true,
    }
  });

  // 3. Create a Daily Activity Report
  await prisma.dailyactivityreport.create({
    data: {
      departmentid: 1,
      facultyid: facultyId,
      reportdate: new Date(new Date().getTime() - 24 * 60 * 60 * 1000), // Yesterday
      summary: 'Taught Intro to Computer Science, Graded Midterm Quizzes, Office Hours',
      status: 'SUBMITTED',
      isactive: true,
    }
  });

  console.log('Successfully seeded faculty demo data!');
  await prisma.$disconnect();
}

main().catch(console.error);
