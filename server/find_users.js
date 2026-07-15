import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Fetching active users...');
  const users = await prisma.user.findMany({
    select: {
      userid: true,
      username: true,
      email: true,
      role: true,
      accountStatus: true
    },
    take: 20
  });
  console.log(JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
