import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({ where: { username: 'hr_user1' } });
  if (!user) return console.log('User not found');
  const userRoles = await prisma.userRole.findMany({
    where: { user_id: user.userid },
    include: {
      role: {
        include: {
          RolePermission: {
            include: { permission: true }
          }
        }
      }
    }
  });
  const perms = [];
  userRoles.forEach(ur => ur.role.RolePermission.forEach(rp => perms.push(`${rp.permission.module}:${rp.permission.action}`)));
  console.log('HR User Permissions:', perms);
}
main().finally(() => prisma.$disconnect());
