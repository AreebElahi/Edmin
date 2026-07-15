import { PrismaClient } from '@prisma/client';

// Removed hardcoded DATABASE_URL

const prisma = new PrismaClient();

async function main() {
  const departments = [
    { code: 'CS', name: 'Computer Science' },
    { code: 'SE', name: 'Software Engineering' },
    { code: 'IT', name: 'Information Technology' },
    { code: 'EE', name: 'Electrical Engineering' },
    { code: 'BBA', name: 'Business Administration' },
  ];

  for (const dept of departments) {
    const exists = await prisma.department.findFirst({ where: { code: dept.code } });
    if (!exists) {
      await prisma.department.create({ data: dept });
    }
  }

  console.log('Departments populated successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
