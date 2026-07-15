const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log(users.map(u => u.email + " -> " + u.role));
}

main().then(() => prisma.$disconnect());
