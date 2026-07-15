import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const DEPARTMENTS = [
  { name: 'Computer Science', code: 'CS', type: 'ACADEMIC' },
  { name: 'Software Engineering', code: 'SE', type: 'ACADEMIC' },
  { name: 'Electrical Engineering', code: 'EE', type: 'ACADEMIC' },
  { name: 'Administration', code: 'ADM', type: 'OPERATIONAL' },
  { name: 'Human Resources', code: 'HR', type: 'OPERATIONAL' },
  { name: 'Maintenance', code: 'MT', type: 'OPERATIONAL' },
  { name: 'Security', code: 'SEC', type: 'OPERATIONAL' },
  { name: 'Transport', code: 'TRP', type: 'OPERATIONAL' },
  { name: 'Support Services', code: 'SUP', type: 'OPERATIONAL' },
  { name: 'Helpers', code: 'HLP', type: 'OPERATIONAL' },
  { name: 'Accounts', code: 'ACC', type: 'OPERATIONAL' },
  { name: 'Library', code: 'LIB', type: 'OPERATIONAL' },
  { name: 'Examination', code: 'EXM', type: 'OPERATIONAL' },
  { name: 'IT Support', code: 'ITS', type: 'OPERATIONAL' },
  { name: 'Undeclared', code: 'UND', type: 'OPERATIONAL' },
];

async function main() {
  for (const dept of DEPARTMENTS) {
    const existing = await prisma.department.findFirst({
      where: { code: dept.code }
    });

    if (!existing) {
      await prisma.department.create({
        data: {
          name: dept.name,
          code: dept.code,
          type: dept.type as any,
          isactive: true
        }
      });
      console.log(`Created department: ${dept.name} (${dept.code})`);
    } else {
      // Update type of existing department
      await prisma.department.update({
        where: { departmentid: existing.departmentid },
        data: { type: dept.type as any }
      });
      console.log(`Updated department type: ${dept.name} (${dept.code}) -> ${dept.type}`);
    }
  }
  console.log('Departments seeded successfully!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
