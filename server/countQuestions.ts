import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const qq = await prisma.quizquestion.count();
  const qb = await prisma.questionbank.count();
  const options = await prisma.quizoption.count();
  
  console.log({ quizquestions: qq, questionbanks: qb, options });
}

main().catch(console.error).finally(() => prisma.$disconnect());
