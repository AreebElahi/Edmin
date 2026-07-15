import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const schedule = await prisma.timetable.findMany({
    where: { courseofferingid: 1 }
  });
  console.log('Schedule:', schedule);
}
main().catch(console.error).finally(() => prisma.$disconnect());
