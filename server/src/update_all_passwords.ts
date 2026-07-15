import prisma from './config/prisma.js';
import { hashData } from './utils/hash.utils.js';

async function main() {
  const hash = await hashData('password123');
  
  const emails = [
    'user1@edmin.com',
    'user2@edmin.com',
    'user3@edmin.com',
    'user4@edmin.com'
  ];

  for (const email of emails) {
    await prisma.user.updateMany({
      where: { email },
      data: { password: hash }
    });
    console.log(`Password updated for ${email} to password123`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
