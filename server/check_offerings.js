import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const offerings = await prisma.courseoffering.findMany({
    select: { courseofferingid: true, status: true, isactive: true }
  });
  console.log('Offerings:', offerings);
}
main().catch(console.error).finally(() => prisma.$disconnect());
