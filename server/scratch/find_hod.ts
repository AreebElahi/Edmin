import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const depts = await prisma.department.findMany({
    where: { hodid: { not: null } }
  });
  if (depts.length > 0) {
    for (const d of depts) {
      const fac = await prisma.faculty.findUnique({ where: { facultyid: d.hodid }});
      if (fac) {
        const user = await prisma.user.findUnique({ where: { userid: fac.userid }});
        console.log(`Dept: ${d.name} -> HOD: ${user?.username} (${user?.email})`);
      }
    }
  } else {
    console.log('No HOD found in database.');
  }
}

run().finally(() => prisma.$disconnect());

run().finally(() => prisma.$disconnect());
