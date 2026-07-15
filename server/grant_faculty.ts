import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function run() {
  console.log('Fetching roles...');
  const facultyRole = await p.role.findUnique({ where: { name: 'FACULTY' } });
  if (!facultyRole) {
    console.log('FACULTY role not found!');
    return;
  }

  const facultyPerms = [
    'FACULTY_ROUTES:ACCESS',
    'DASHBOARD:FACULTY',
    'QUIZZES:CREATE',
    'QUIZZES:GRADE',
    'AI_QUIZ:MANAGE',
    'ATTENDANCE:VIEW_SESSIONS',
    'ATTENDANCE:VIEW_ROSTER',
    'ATTENDANCE:MARK',
    'ASSIGNMENTS:CREATE',
    'ASSIGNMENTS:GRADE',
    'FACULTY:TEACHER',
    'COURSES:READ'
  ];

  console.log('Fetching all permissions...');
  const allPerms = await p.permission.findMany();
  
  const permMap = new Map();
  for (const p of allPerms) {
    permMap.set(`${p.module}:${p.action}`, p.id);
  }

  let granted = 0;
  for (const permKey of facultyPerms) {
    const permId = permMap.get(permKey);
    if (permId) {
      await p.rolePermission.upsert({
        where: { role_id_permission_id: { role_id: facultyRole.id, permission_id: permId } },
        update: {},
        create: { role_id: facultyRole.id, permission_id: permId }
      });
      granted++;
    } else {
      console.log('Permission not found:', permKey);
    }
  }

  console.log(`Granted ${granted} permissions to FACULTY.`);
}

run()
  .catch(console.error)
  .finally(() => p.$disconnect());
