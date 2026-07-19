import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Database...');

  // 1. Roles
  const roles = ['ADMIN', 'HR', 'FACULTY', 'STUDENT'];
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, description: `${roleName} Role` }
    });
  }

  // 2. Permissions
  const permissions = [
    { module: 'ADMIN_ROUTES', action: 'ACCESS' },
    { module: 'AI_QUIZ', action: 'ATTEMPT' },
    { module: 'AI_QUIZ', action: 'MANAGE' },
    { module: 'ATTENDANCE', action: 'MARK' },
    { module: 'ATTENDANCE', action: 'VIEW_OWN' },
    { module: 'ATTENDANCE', action: 'VIEW_ROSTER' },
    { module: 'ATTENDANCE', action: 'VIEW_SESSIONS' },
    { module: 'COMMUNICATIONS', action: 'READ' },
    { module: 'COMMUNICATIONS', action: 'UPDATE' },
    { module: 'COURSES', action: 'CREATE_OFFERING' },
    { module: 'COURSES', action: 'ENROLL' },
    { module: 'DASHBOARD', action: 'ADMIN' },
    { module: 'DASHBOARD', action: 'FACULTY' },
    { module: 'DASHBOARD', action: 'HR' },
    { module: 'DASHBOARD', action: 'STUDENT' },
    { module: 'DEPARTMENTS', action: 'CREATE' },
    { module: 'DEPARTMENTS', action: 'DELETE' },
    { module: 'DEPARTMENTS', action: 'READ' },
    { module: 'DEPARTMENTS', action: 'UPDATE' },
    { module: 'EXAMINATION', action: 'READ' },
    { module: 'EXAMINATION', action: 'UPDATE' },
    { module: 'FACULTY_OVERSIGHT', action: 'READ' },
    { module: 'FACULTY_OVERSIGHT', action: 'UPDATE' },
    { module: 'FACULTY_ROUTES', action: 'ACCESS' },
    { module: 'FINANCE', action: 'READ' },
    { module: 'FINANCE', action: 'UPDATE' },
    { module: 'OVERSIGHT', action: 'READ' },
    { module: 'OVERSIGHT', action: 'UPDATE' },
    { module: 'QUIZZES', action: 'READ' },
    { module: 'REPORTS', action: 'READ' },
    { module: 'SEMESTERS', action: 'READ' },
    { module: 'SEMESTERS', action: 'UPDATE' },
    { module: 'SETTINGS', action: 'READ' },
    { module: 'SETTINGS', action: 'UPDATE' },
    { module: 'STUDENT_OVERSIGHT', action: 'READ' },
    { module: 'STUDENT_OVERSIGHT', action: 'UPDATE' },
    { module: 'STUDENT_ROUTES', action: 'ACCESS' },
    { module: 'TICKETS', action: 'CREATE' },
    { module: 'TICKETS', action: 'DELETE' },
    { module: 'TICKETS', action: 'READ' },
    { module: 'TICKETS', action: 'UPDATE' },
    { module: 'TIMETABLE', action: 'READ' },
    { module: 'TIMETABLE', action: 'UPDATE' },
    { module: 'USERS', action: 'CREATE' },
    { module: 'USERS', action: 'READ' },
    { module: 'USERS', action: 'UPDATE' },
    { module: 'WORKFLOW', action: 'READ' },
    { module: 'WORKFLOW', action: 'UPDATE' }
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { module_action: { module: perm.module, action: perm.action } },
      update: {},
      create: { module: perm.module, action: perm.action }
    });
  }

  // 3. Assign Admin Permissions
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  const studentRole = await prisma.role.findUnique({ where: { name: 'STUDENT' } });
  const facultyRole = await prisma.role.findUnique({ where: { name: 'FACULTY' } });
  const hrRole = await prisma.role.findUnique({ where: { name: 'HR' } });
  const allPerms = await prisma.permission.findMany();

  if (adminRole) {
    for (const p of allPerms) {
      await prisma.rolePermission.upsert({
        where: { role_id_permission_id: { role_id: adminRole.id, permission_id: p.id } },
        update: {},
        create: { role_id: adminRole.id, permission_id: p.id }
      });
    }
  }

  const grantPerm = async (role: any, moduleName: string, actionName: string) => {
    if (!role) return;
    const p = allPerms.find(perm => perm.module === moduleName && perm.action === actionName);
    if (p) {
      await prisma.rolePermission.upsert({
        where: { role_id_permission_id: { role_id: role.id, permission_id: p.id } },
        update: {},
        create: { role_id: role.id, permission_id: p.id }
      });
    }
  };

  await grantPerm(studentRole, 'STUDENT_ROUTES', 'ACCESS');
  await grantPerm(studentRole, 'DASHBOARD', 'STUDENT');
  
  await grantPerm(facultyRole, 'FACULTY_ROUTES', 'ACCESS');
  await grantPerm(facultyRole, 'DASHBOARD', 'FACULTY');
  
  await grantPerm(hrRole, 'DASHBOARD', 'HR');
  await grantPerm(hrRole, 'ADMIN_ROUTES', 'ACCESS');
  await grantPerm(hrRole, 'USERS', 'READ');
  await grantPerm(hrRole, 'USERS', 'CREATE');
  await grantPerm(hrRole, 'USERS', 'UPDATE');
  await grantPerm(hrRole, 'DEPARTMENTS', 'READ');
  await grantPerm(hrRole, 'DEPARTMENTS', 'CREATE');
  await grantPerm(hrRole, 'DEPARTMENTS', 'UPDATE');
  await grantPerm(hrRole, 'FINANCE', 'READ');
  await grantPerm(hrRole, 'FINANCE', 'UPDATE');
  await grantPerm(hrRole, 'REPORTS', 'READ');
  await grantPerm(hrRole, 'SETTINGS', 'READ');
  await grantPerm(hrRole, 'SETTINGS', 'UPDATE');
  await grantPerm(hrRole, 'OVERSIGHT', 'READ');
  await grantPerm(hrRole, 'OVERSIGHT', 'UPDATE');

  // 4. Seed Reference Test Users
  console.log('Seeding reference test users...');
  const passwordHash = await bcrypt.hash('password123', 10);
  
  // Faculty User (user1)
  let user1 = await prisma.user.upsert({
    where: { username: 'faculty_user1' },
    update: { institutionalEmail: 'user1@edmin.com', password: passwordHash, role: 'FACULTY', accountStatus: 'ACTIVE' },
    create: { username: 'faculty_user1', institutionalEmail: 'user1@edmin.com', email: 'user1@edmin.com', password: passwordHash, role: 'FACULTY', accountStatus: 'ACTIVE' }
  });
  if (facultyRole) {
    await prisma.userRole.upsert({
      where: { user_id_role_id: { user_id: user1.userid, role_id: facultyRole.id } },
      update: {},
      create: { user_id: user1.userid, role_id: facultyRole.id }
    });
  }

  // Admin User (user3)
  let user3 = await prisma.user.upsert({
    where: { username: 'admin_user3' },
    update: { institutionalEmail: 'user3@edmin.com', password: passwordHash, role: 'ADMIN', accountStatus: 'ACTIVE' },
    create: { username: 'admin_user3', institutionalEmail: 'user3@edmin.com', email: 'user3@edmin.com', password: passwordHash, role: 'ADMIN', accountStatus: 'ACTIVE' }
  });
  if (adminRole) {
    await prisma.userRole.upsert({
      where: { user_id_role_id: { user_id: user3.userid, role_id: adminRole.id } },
      update: {},
      create: { user_id: user3.userid, role_id: adminRole.id }
    });
  }

  // Student User
  let student1 = await prisma.user.upsert({
    where: { username: 'student_user1' },
    update: { institutionalEmail: 'student@edmin.com', password: passwordHash, role: 'STUDENT', accountStatus: 'ACTIVE' },
    create: { username: 'student_user1', institutionalEmail: 'student@edmin.com', email: 'student@edmin.com', password: passwordHash, role: 'STUDENT', accountStatus: 'ACTIVE' }
  });
  if (studentRole) {
    await prisma.userRole.upsert({
      where: { user_id_role_id: { user_id: student1.userid, role_id: studentRole.id } },
      update: {},
      create: { user_id: student1.userid, role_id: studentRole.id }
    });
  }

  // HR User
  let hr1 = await prisma.user.upsert({
    where: { username: 'hr_user1' },
    update: { institutionalEmail: 'user4@edmin.com', password: passwordHash, role: 'HR', accountStatus: 'ACTIVE' },
    create: { username: 'hr_user1', institutionalEmail: 'user4@edmin.com', email: 'user4@edmin.com', password: passwordHash, role: 'HR', accountStatus: 'ACTIVE' }
  });
  if (hrRole) {
    await prisma.userRole.upsert({
      where: { user_id_role_id: { user_id: hr1.userid, role_id: hrRole.id } },
      update: {},
      create: { user_id: hr1.userid, role_id: hrRole.id }
    });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
