import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'uzmaparveen@edmin.com';
  const pass = '6c9hir4f';
  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) {
    console.log('User not found!');
  } else {
    console.log('User found:', user.userid, user.email, user.role, 'isactive:', user.isactive);
    const match = await bcrypt.compare(pass, user.password);
    console.log('Password match:', match);
  }
}

main().finally(() => prisma.$disconnect());
