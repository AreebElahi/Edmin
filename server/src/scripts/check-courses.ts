

import prisma from '../config/prisma.js';

async function main() {
  const courses = await prisma.course.findMany();
  console.log(JSON.stringify(courses, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
