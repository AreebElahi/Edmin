import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { generateAccessToken } from './src/utils/jwt.utils.js';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { username: 'hr_user1' } });
  if (!user) { console.log('No user'); return; }
  
  const token = generateAccessToken({ userId: user.userid, email: user.email, role: user.role, roles: [user.role], version: user.version });
  console.log('Token:', token);

  const res = await fetch('http://localhost:5000/api/v1/admin/users', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Response:', data);
}

main().finally(() => prisma.$disconnect());
