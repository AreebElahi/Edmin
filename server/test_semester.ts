import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const activeSemester = await prisma.semester.findFirst({
      where: { isactive: true },
      orderBy: { startdate: 'desc' }
  });
  console.log("Active semester:", activeSemester);
}
run().finally(() => prisma.$disconnect());
