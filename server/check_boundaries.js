import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const boundaries = await prisma.gradeboundary.findMany();
  console.log('Boundaries length:', boundaries.length);
  if (boundaries.length > 0) {
    console.log(boundaries);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
