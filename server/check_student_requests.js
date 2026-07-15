import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const requests = await prisma.enrollmentrequest.findMany({
    where: { student: { userid: 3 } }
  });
  console.log('Requests:', requests);
}
main().catch(console.error).finally(() => prisma.$disconnect());
