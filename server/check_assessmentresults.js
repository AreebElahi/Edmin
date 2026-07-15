import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const results = await prisma.assessmentresult.findMany();
  console.log('Results:', results);
}

main().catch(console.error).finally(() => prisma.$disconnect());
