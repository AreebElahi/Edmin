import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const e = await prisma.courseenrollment.findFirst();
  console.log(e);
}
main();
