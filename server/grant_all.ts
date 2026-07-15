import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function run() {
  console.log('Fetching roles...');
  const roles = await p.role.findMany();
  
  console.log('Fetching all permissions...');
  const allPerms = await p.permission.findMany();
  const permMap = new Map();
  for (const perm of allPerms) {
    permMap.set(`${perm.module}:${perm.action}`, perm.id);
  }

  const roleGrants: Record<string, string[]> = {
    'ADMIN': Array.from(permMap.keys()),
    'SYSTEM_ADMIN': Array.from(permMap.keys()),
    'STUDENT': [
      'STUDENT_ROUTES:ACCESS',
      'DASHBOARD:STUDENT',
      'QUIZZES:ATTEMPT',
      'AI_QUIZ:ATTEMPT',
      'COURSES:ENROLL',
      'ATTENDANCE:VIEW_OWN',
      'ASSIGNMENTS:SUBMIT'
    ],
    'FACULTY': [
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
      'FACULTY:TEACHER'
    ],
    'HR': [
      'ADMIN_ROUTES:ACCESS',
      'DASHBOARD:HR',
      'DEPARTMENTS:READ',
      'USERS:READ',
      'FINANCE:READ',
      'REPORTS:READ',
      'FACULTY_OVERSIGHT:READ',
      'FACULTY_OVERSIGHT:UPDATE'
    ]
  };

  const toCreate = [];
  for (const role of roles) {
    const grants = roleGrants[role.name];
    if (grants) {
      for (const grant of grants) {
        const permId = permMap.get(grant);
        if (permId) {
          toCreate.push({ role_id: role.id, permission_id: permId });
        }
      }
    }
  }

  console.log(`Clearing existing role permissions...`);
  await p.rolePermission.deleteMany({});
  
  console.log(`Inserting ${toCreate.length} role permissions...`);
  await p.rolePermission.createMany({
    data: toCreate,
    skipDuplicates: true
  });
  
  console.log('Done!');
}

run()
  .catch(console.error)
  .finally(() => p.$disconnect());
