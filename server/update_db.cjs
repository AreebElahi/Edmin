const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const department = await prisma.department.update({
    where: { departmentid: 1 },
    data: {
      hodid: 6,
      supervisorid: 6
    }
  });
  console.log('Updated department:', department);
}
main().finally(() => prisma.$disconnect());
