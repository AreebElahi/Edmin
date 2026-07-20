import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const sub = await prisma.assignmentsubmission.findMany();
  console.log('Submissions:', sub);
}
main().catch(console.error).finally(() => prisma.$disconnect());
