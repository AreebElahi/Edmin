import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const enrollments = await prisma.courseenrollment.findMany({
    where: { student: { userid: 3 } },
    select: { courseofferingid: true }
  });
  console.log('Enrollments:', enrollments);
}
main().catch(console.error).finally(() => prisma.$disconnect());
