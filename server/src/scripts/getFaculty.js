
const prisma = require('../config/prisma.js').default;

async function main() {
  const users = await prisma.user.findMany({
    where: { role: { name: 'FACULTY' } },
    select: { email: true }
  });
  console.log('FACULTY USERS:', users);
  
  const defaultPass = "password123"; // the standard default password in these apps usually
  console.log('Try password:', defaultPass);
  
  await prisma.$disconnect();
}

main();
