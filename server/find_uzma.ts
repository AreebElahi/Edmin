import prisma from './src/config/prisma.js';

async function findUzma() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { identifier: { contains: 'uzma', mode: 'insensitive' } },
        { email: { contains: 'uzma', mode: 'insensitive' } }
      ]
    },
    select: {
      userid: true,
      identifier: true,
      email: true,
      role: true
    }
  });
  console.log('Found users:', users);
}

findUzma().finally(() => prisma.$disconnect());
