

import prisma from '../config/prisma.js';

async function main() {
  const updated = await prisma.course.update({
    where: { courseid: 6 },
    data: { isactive: false }
  });
  console.log(updated);
}

main().catch(console.error).finally(() => prisma.$disconnect());
