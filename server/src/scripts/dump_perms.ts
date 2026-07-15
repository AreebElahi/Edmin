
import { getUserPermissions } from '../services/admin/rbac.service.js';

import prisma from '../config/prisma.js';

async function run() {
  const perms = await getUserPermissions(2);
  console.log(Array.from(perms));
}
run().finally(() => prisma.$disconnect());
