import prisma from '../config/prisma.js';
import { ROLE_DEFAULT_USERROLE_MAP } from '../config/roles.config.js';

async function backfillUserRoles() {
  console.log('--- STARTING RBAC BACKFILL ---');
  
  const users = await prisma.user.findMany({
    include: {
      user_roles: true
    }
  });

  let backfilledCount = 0;
  const breakdown: Record<string, number> = {};

  for (const user of users) {
    // We strictly filter for users with ZERO UserRole entries.
    // This ensures we do not overwrite or auto-correct intentional manual mappings (e.g., safe users).
    if (user.user_roles.length === 0) {
      const defaultRoles = ROLE_DEFAULT_USERROLE_MAP[user.role] || [];
      
      if (defaultRoles.length > 0) {
        const rolesInDb = await prisma.role.findMany({
          where: { name: { in: defaultRoles } }
        });

        if (rolesInDb.length > 0) {
          await prisma.userRole.createMany({
            data: rolesInDb.map(r => ({
              user_id: user.userid,
              role_id: r.id
            })),
            skipDuplicates: true
          });
          
          backfilledCount++;
          breakdown[user.role] = (breakdown[user.role] || 0) + 1;
        }
      } else {
        console.warn(`WARNING: No default role mapping defined for enum role ${user.role} (User ID: ${user.userid})`);
      }
    }
  }

  console.log(`\n--- BACKFILL COMPLETE ---`);
  console.log(`Total users backfilled: ${backfilledCount}`);
  if (backfilledCount > 0) {
    console.log(`Breakdown by enum role:`);
    for (const [role, count] of Object.entries(breakdown)) {
      console.log(` - ${role}: ${count}`);
    }
  }
}

backfillUserRoles()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
