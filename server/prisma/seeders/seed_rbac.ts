import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const permissions = [
  // Admin Routes
  { module: 'ADMIN_ROUTES', action: 'ACCESS' },
  
  // Faculty Routes
  { module: 'FACULTY_ROUTES', action: 'ACCESS' },
  
  // Student Routes
  { module: 'STUDENT_ROUTES', action: 'ACCESS' },
  
  // Dashboards
  { module: 'DASHBOARD', action: 'STUDENT' },
  { module: 'DASHBOARD', action: 'FACULTY' },
  { module: 'DASHBOARD', action: 'ADMIN' },
  { module: 'DASHBOARD', action: 'HR' },
  
  // Quizzes
  { module: 'QUIZZES', action: 'CREATE' },
  { module: 'QUIZZES', action: 'GRADE' },
  { module: 'QUIZZES', action: 'ATTEMPT' },
  
  // AI Quizzes
  { module: 'AI_QUIZ', action: 'MANAGE' },
  { module: 'AI_QUIZ', action: 'ATTEMPT' },
  
  // Courses
  { module: 'COURSES', action: 'CREATE' },
  { module: 'COURSES', action: 'CREATE_OFFERING' },
  { module: 'COURSES', action: 'ENROLL' },
  
  // Attendance
  { module: 'ATTENDANCE', action: 'VIEW_OWN' },
  { module: 'ATTENDANCE', action: 'VIEW_SESSIONS' },
  { module: 'ATTENDANCE', action: 'VIEW_ROSTER' },
  { module: 'ATTENDANCE', action: 'MARK' },
  
  // Assignments
  { module: 'ASSIGNMENTS', action: 'CREATE' },
  { module: 'ASSIGNMENTS', action: 'GRADE' },
  { module: 'ASSIGNMENTS', action: 'SUBMIT' },
  
  // Auth
  { module: 'AUTH', action: 'ADMIN_ONLY' },

  // Departments
  { module: 'DEPARTMENTS', action: 'READ' },
  { module: 'USERS', action: 'READ' },
  { module: 'SETTINGS', action: 'READ' },

  // Sub-roles
  { module: 'FACULTY', action: 'HOD' },
  { module: 'FACULTY', action: 'SUPERVISOR' },
  { module: 'FACULTY', action: 'TEACHER' },

  // Finance
  { module: 'FINANCE', action: 'READ' },
  { module: 'FINANCE', action: 'UPDATE' },
  
  // Examination
  { module: 'EXAMINATION', action: 'READ' },
  { module: 'EXAMINATION', action: 'UPDATE' },

  // Timetable
  { module: 'TIMETABLE', action: 'READ' },
  { module: 'TIMETABLE', action: 'UPDATE' },

  // Workflow & Communications
  { module: 'WORKFLOW', action: 'READ' },
  { module: 'WORKFLOW', action: 'UPDATE' },
  { module: 'COMMUNICATIONS', action: 'READ' },
  { module: 'COMMUNICATIONS', action: 'UPDATE' },

  // Semesters & Reports
  { module: 'SEMESTERS', action: 'READ' },
  { module: 'SEMESTERS', action: 'UPDATE' },
  { module: 'REPORTS', action: 'READ' },

  // Oversight
  { module: 'OVERSIGHT', action: 'READ' },
  { module: 'OVERSIGHT', action: 'UPDATE' },
  { module: 'FACULTY_OVERSIGHT', action: 'READ' },
  { module: 'FACULTY_OVERSIGHT', action: 'UPDATE' },
  { module: 'STUDENT_OVERSIGHT', action: 'READ' },
  { module: 'STUDENT_OVERSIGHT', action: 'UPDATE' },

  // Quizzes metadata
  { module: 'QUIZZES', action: 'READ' },
];

const roleGrants: Record<string, string[]> = {
  'ADMIN': [], // Will dynamically get all permissions
  'SYSTEM_ADMIN': [], // Gets all permissions
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
    'FACULTY:TEACHER' // Default sub-role for all faculty
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

async function seedRbac() {
  console.log('Seeding RBAC permissions...');

  // 1. Insert permissions safely using upsert (via a loop to avoid unique constraint issues if we add more fields later, or just createMany with skipDuplicates)
  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: {
        module_action: {
          module: perm.module,
          action: perm.action
        }
      },
      update: {},
      create: {
        module: perm.module,
        action: perm.action
      }
    });
  }

  // Refetch all to get their IDs
  const allPerms = await prisma.permission.findMany();
  const permMap = new Map<string, number>();
  for (const p of allPerms) {
    permMap.set(`${p.module}:${p.action}`, p.id); // e.g. "AUTH:ADMIN_ONLY" -> 1
  }

  const roles = await prisma.role.findMany();
  
  // 2. Clear existing role permissions (optional, but good for a clean slate if testing)
  await prisma.rolePermission.deleteMany({});
  
  for (const role of roles) {
    let grants = roleGrants[role.name];
    
    // Admin gets everything
    if (role.name === 'ADMIN' || role.name === 'SYSTEM_ADMIN') {
      grants = Array.from(permMap.keys());
    }

    if (grants) {
      console.log(`Granting permissions for role: ${role.name}`);
      for (const permStr of grants) {
        const permId = permMap.get(permStr);
        if (permId) {
          // Upsert RolePermission
          await prisma.rolePermission.upsert({
            where: {
              role_id_permission_id: {
                role_id: role.id,
                permission_id: permId
              }
            },
            update: {},
            create: {
              role_id: role.id,
              permission_id: permId
            }
          });
        }
      }
    }
  }

  console.log('RBAC Seeding complete.');
}

seedRbac()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
