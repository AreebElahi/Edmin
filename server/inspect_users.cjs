const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    include: {
      departmentmember: {
        include: { department: true }
      }
    }
  });
  console.log(JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}
main();
