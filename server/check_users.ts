import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.user.findMany({
  where: { username: { in: ['student_user1', 'hr_user1'] } }
}).then(users => console.log(JSON.stringify(users, null, 2))).finally(() => prisma.$disconnect());
