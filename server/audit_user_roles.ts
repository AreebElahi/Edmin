import prisma from './src/config/prisma.js';

async function audit() {
  const users = await prisma.user.findMany({
    include: {
      user_roles: true
    }
  });

  const totalUsers = users.length;
  const zeroUserRoleCounts: Record<string, number> = {};
  let usersWithZeroRoles = 0;
  let usersWithPartialMappings = 0; // Not strictly defined, but anyone with > 0 UserRole entries is "complete" for now, or maybe we just check zero.

  for (const user of users) {
    if (user.user_roles.length === 0) {
      usersWithZeroRoles++;
      zeroUserRoleCounts[user.role] = (zeroUserRoleCounts[user.role] || 0) + 1;
    } else {
      // For now, if they have > 0, they have mappings. 
      usersWithPartialMappings++;
    }
  }

  console.log(`--- AUDIT REPORT ---`);
  console.log(`Total Users: ${totalUsers}`);
  console.log(`Users with ZERO UserRole entries: ${usersWithZeroRoles}`);
  if (usersWithZeroRoles > 0) {
    console.log(`Breakdown by enum role:`);
    for (const [role, count] of Object.entries(zeroUserRoleCounts)) {
      console.log(` - ${role}: ${count}`);
    }
  }
  console.log(`Users with at least one UserRole entry: ${usersWithPartialMappings}`);
}

audit()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
