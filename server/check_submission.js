import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const submission = await prisma.assignmentsubmission.findFirst();
  console.log('Submission keys:', Object.keys(submission || {}));
}
main().catch(console.error).finally(() => prisma.$disconnect());
