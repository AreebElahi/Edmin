import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const leaves = await prisma.leaverequest.findMany({
    where: { user: { faculty: { departmentid: 1 } } }
  });
  console.log('HOD Query leaves for dept 1:', leaves.length);
  
  const leaves2 = await prisma.leaverequest.findMany({
    where: { user: { faculty: { departmentid: 2 } } }
  });
  console.log('HOD Query leaves for dept 2:', leaves2.length);
}
main();
