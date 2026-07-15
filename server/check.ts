import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const enrollments = await prisma.courseenrollment.findMany({ include: { courseoffering: true }});
  console.log(JSON.stringify(enrollments.map(e => ({ e_id: e.courseenrollmentid, offering_id: e.courseofferingid, actual_offering_id: e.courseoffering?.courseofferingid })), null, 2));
}
main().finally(() => prisma.$disconnect());
