import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const leaves = await prisma.leaverequest.findMany({
    where: {
      user: { faculty: { departmentid: 1 } }
    },
  });
  console.log("Leaves for faculty.departmentid = 1:", leaves.length);
  
  const leaves2 = await prisma.leaverequest.findMany({
    where: {
      user: { departmentmember: { some: { departmentid: 1 } } }
    },
  });
  console.log("Leaves for departmentmember.departmentid = 1:", leaves2.length);
}
main();
