

import prisma from '../config/prisma.js';

async function main() {
  const courses = await prisma.course.findMany({
    select: { courseid: true, code: true, isactive: true, basecapacity: true }
  });
  console.log(courses);
}

main().catch(console.error).finally(() => prisma.$disconnect());
