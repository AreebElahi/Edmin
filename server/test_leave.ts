import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const leave = await prisma.leaverequest.findFirst({ orderBy: { leaverequestid: 'desc' } });
  console.log("Latest Leave:", leave);
}
run();
