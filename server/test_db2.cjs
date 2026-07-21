const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    where: { userid: { in: [43, 36] } }
  });
  console.log('Users:', JSON.stringify(users, null, 2));
}
main().finally(() => prisma.$disconnect());
