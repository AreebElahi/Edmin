import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const leaves = await prisma.leaverequest.findMany({
    include: {
        user: { include: { faculty: true } }
    }
  });
  console.dir(leaves, { depth: null });
}
main();
