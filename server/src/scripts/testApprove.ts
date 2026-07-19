import prisma from '../../config/prisma.js';
async function run() {
  const leaves = await prisma.leaverequest.findMany();
  console.log(leaves);
}
run();
