import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const sub = await prisma.assignmentsubmission.findFirst();
  console.log('Submission:', sub);
}
main().catch(console.error).finally(() => prisma.$disconnect());
