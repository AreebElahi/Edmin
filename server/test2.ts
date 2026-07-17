import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const depts = await prisma.department.findMany({ where: { hodid: { not: null } } });
  console.dir(depts, {depth: null});
  
  const hodd = await prisma.department.findFirst({ where: { hodid: 6 } }); // assuming user is id 6, wait, who is the HOD user?
}
main();
