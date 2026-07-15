import prisma from './src/config/prisma.js';
async function run() {
  const users = await prisma.user.findMany({ select: { email: true, role: true, accountStatus: true } });
  console.log(users);
}
run().then(() => prisma.$disconnect());
