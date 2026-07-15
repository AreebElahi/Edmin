import prisma from './src/config/prisma.js';

async function findUsers() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { username: { startsWith: 'n', mode: 'insensitive' } },
        { username: { startsWith: 'u', mode: 'insensitive' } },
        { email: { startsWith: 'n', mode: 'insensitive' } },
        { email: { startsWith: 'u', mode: 'insensitive' } }
      ]
    },
    include: {
      user_roles: { include: { role: true } }
    }
  });

  for (const u of users) {
    console.log(`ID: ${u.userid} | Username: ${u.username} | Email: ${u.email} | Role: ${u.role}`);
    console.log(`   UserRoles: ${u.user_roles.map(ur => ur.role.name).join(', ')}`);
  }
}

findUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
