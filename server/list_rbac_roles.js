import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Fetching roles from Role table...');
  const roles = await prisma.role.findMany({
    include: {
      RolePermission: {
        include: { permission: true }
      }
    }
  });
  console.log('Roles and permissions:');
  console.log(JSON.stringify(roles, null, 2));

  console.log('Fetching all permissions from Permission table...');
  const permissions = await prisma.permission.findMany();
  console.log('All permissions in DB:', JSON.stringify(permissions, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
