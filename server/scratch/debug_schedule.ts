import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userId = 3;
  
  // Find enrollments for student
  const student = await prisma.student.findFirst({ where: { userid: userId } });
  if (!student) {
    console.log('No student found');
    return;
  }
  
  const enrollments = await prisma.courseenrollment.findMany({
    where: { studentid: student.studentid }
  });
  console.log('Enrollments:', enrollments);
  
  for (const e of enrollments) {
    const timetables = await prisma.timetable.findMany({
      where: { courseofferingid: e.courseofferingid }
    });
    console.log(`Timetables for offering ${e.courseofferingid}:`, timetables);
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
