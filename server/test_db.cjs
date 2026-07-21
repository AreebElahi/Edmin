const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'hod@edmin.com' },
    include: {
      user_roles: { include: { role: true } },
    }
  });
  console.log('User:', JSON.stringify(user, null, 2));

  const faculty = await prisma.faculty.findFirst({
    where: { userid: user.userid },
    include: { department: true }
  });
  console.log('Faculty:', JSON.stringify(faculty, null, 2));
}
main().finally(() => prisma.$disconnect());
