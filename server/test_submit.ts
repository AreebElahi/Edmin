import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const userId = 25; // Computer Science HOD? Wait, I need a faculty userId.
  const faculty = await prisma.faculty.findFirst({
    where: { isactive: true },
  });
  if (!faculty) {
      console.log("no faculty");
      return;
  }
  
  const courseOfferingIds = [1, 2, 3]; // Mock valid ids
  const validCourseOfferingIds = courseOfferingIds.filter(id => typeof id === 'number' && !isNaN(id) && id > 0);
  
  const activeSemester = await prisma.semester.findFirst({
      where: { isactive: true },
      orderBy: { startdate: 'desc' }
  });

  const targetSemesterId = activeSemester!.semesterid;

  try {
      await prisma.$transaction(async (tx) => {
        let teachingLoad = await tx.teachingload.findFirst({
          where: {
            facultyid: faculty.facultyid,
            semesterid: targetSemesterId,
            status: 'PENDING',
            isactive: true
          }
        });

        if (teachingLoad) {
          const existing = await tx.teachingassignment.findMany({
            where: { teachingloadid: teachingLoad.teachingloadid, isactive: true },
            select: { courseofferingid: true }
          });
          const existingIds = existing.map(e => e.courseofferingid);
          
          const toAdd = validCourseOfferingIds.filter(id => !existingIds.includes(id));
          if (toAdd.length > 0) {
            await tx.teachingassignment.createMany({
              data: toAdd.map(id => ({
                teachingloadid: teachingLoad!.teachingloadid,
                courseofferingid: id
              }))
            });
          }
        } else {
          teachingLoad = await tx.teachingload.create({
            data: {
              facultyid: faculty.facultyid,
              semesterid: targetSemesterId,
              status: 'PENDING',
              supervisorstatus: 'PENDING',
              hodstatus: 'PENDING',
              teachingassignment: {
                create: validCourseOfferingIds.map(id => ({
                  courseofferingid: id
                }))
              }
            }
          });
        }
        console.log("Success");
      });
  } catch (err) {
      console.error(err);
  }
}
run().finally(() => prisma.$disconnect());
