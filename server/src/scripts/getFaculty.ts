
import prisma from '../config/prisma.js';

async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'FACULTY' },
    select: { email: true }
  });
  console.log('FACULTY USERS:', users);
  
  const defaultPass = "password123";
  console.log('Try password:', defaultPass);
  
  await prisma.$disconnect();
}

main();
