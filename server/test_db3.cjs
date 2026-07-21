const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const semester = await prisma.semester.findFirst({ where: { status: 'PUBLISHED' } });
  const faculty = await prisma.faculty.findFirst({ where: { userid: 6 } });
  
  const availableCourses = await prisma.courseoffering.findMany({
      where: { semesterid: semester.semesterid, departmentid: faculty.departmentid },
      include: { course: true }
  });
  console.log('Available:', JSON.stringify(availableCourses.slice(0, 2), null, 2));
}
main().finally(() => prisma.$disconnect());
