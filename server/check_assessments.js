import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const assessments = await prisma.assessment.findMany();
  console.log('Assessments:', assessments);
}

main().catch(console.error).finally(() => prisma.$disconnect());
