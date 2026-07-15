import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding History Log Records...');
  
  const faculties = await prisma.faculty.findMany({ include: { user: true } });
  
  for (const f of faculties) {
    // 1. Seed Leave Requests
    const existingLeave = await prisma.leaverequest.findFirst({ where: { userid: f.userid } });
    if (!existingLeave) {
      await prisma.leaverequest.create({
        data: {
          userid: f.userid,
          startdate: new Date(Date.now() - 86400000 * 5), // 5 days ago
          enddate: new Date(Date.now() - 86400000 * 3), // 3 days ago
          leavetype: 'SICK',
          status: 'APPROVED',
          reason: 'Fever and cold',

        }
      });
      await prisma.leaverequest.create({
        data: {
          userid: f.userid,
          startdate: new Date(Date.now() + 86400000 * 10), // 10 days from now
          enddate: new Date(Date.now() + 86400000 * 12),
          leavetype: 'CASUAL',
          status: 'PENDING',
          reason: 'Family event',
        }
      });
      console.log(`Created Leave Requests for Faculty ${f.facultyid}`);
    }

    // 2. Seed Teaching Loads
    const existingLoad = await prisma.teachingload.findFirst({ where: { facultyid: f.facultyid } });
    if (!existingLoad) {
      // Find a course offering
      const offering = await prisma.courseoffering.findFirst();
      if (offering) {
        await prisma.teachingload.create({
          data: {
            facultyid: f.facultyid,
            semesterid: offering.semesterid,
            status: 'APPROVED',
            supervisorstatus: 'APPROVED',
            hodstatus: 'APPROVED',
            teachingassignment: {
              create: {
                courseofferingid: offering.courseofferingid
              }
            }
          }
        });
        console.log(`Created Teaching Load for Faculty ${f.facultyid}`);
      }
    }

    // 3. Seed Activity Reports
    const existingActivity = await prisma.dailyactivityreport.findFirst({ where: { facultyid: f.facultyid } });
    if (!existingActivity) {
      await prisma.dailyactivityreport.create({
        data: {
          facultyid: f.facultyid,
          departmentid: f.departmentid || 1,
          reportdate: new Date(),
          summary: 'Taught 2 classes and graded assignments',
          status: 'APPROVED',
          dailyreportactivity: {
            create: [
              { title: 'Lecture', detail: 'Covered AI Module 3', sequence: 0 },
              { title: 'Grading', detail: 'Graded Midterm exams', sequence: 1 }
            ]
          }
        }
      });
      console.log(`Created Activity Report for Faculty ${f.facultyid}`);
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
