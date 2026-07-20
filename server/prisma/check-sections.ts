import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const s = await prisma.section.findMany({ include: { department: true, program: true } });
  console.log(JSON.stringify(s, null, 2));
}

main().finally(() => prisma.$disconnect());
