import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const offeringId = 1; // Assuming CS101 is 1
  const studentId = 1; // Assuming studentid for user 3 is 1

  const courseoffering = await prisma.courseoffering.findUnique({
    where: { courseofferingid: offeringId },
    include: { course: true }
  });

  console.log('Seeding assignments for:', courseoffering.course.code);

  const scores = [100, 10, 100];
  
  for (let i = 0; i < scores.length; i++) {
    const a = await prisma.assignment.create({
      data: {
        courseofferingid: offeringId,
        title: `Test Assignment ${i+1}`,
        description: `This is a test assignment ${i+1}`,
        duedate: new Date(),
        maxmarks: 100,
        isactive: true,
      }
    });

    await prisma.assignmentsubmission.create({
      data: {
        assignmentid: a.assignmentid,
        studentid: studentId,
        status: 'GRADED',
        fileUrl: `uploads/test${i+1}.pdf`,
        isactive: true,
      }
    });

    await prisma.assessmentresult.create({
      data: {
        // Wait, assessmentresult requires assessmentid_studentid!
        // But there is NO assessment!
        // The assessmentresult has an assignmentid? 
        // Let's check assessmentresult model.
      }
    });
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
