import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const departments = await prisma.department.findMany();
  console.log('Departments found:');
  departments.forEach(d => console.log(`${d.departmentid} - ${d.name} (${d.code})`));
  
  if (departments.length === 0) {
    console.log('No departments found. Creating one...');
    const newDept = await prisma.department.create({
      data: {
        name: 'Computer Science',
        code: 'CS',
        isactive: true,
      }
    });
    departments.push(newDept);
  }

  const defaultDept = departments[0];

  const programsToCreate = [
    { name: 'BS Computer Science', code: 'BSCS', departmentid: defaultDept.departmentid },
    { name: 'MS Computer Science', code: 'MSCS', departmentid: defaultDept.departmentid },
    { name: 'BS Software Engineering', code: 'BSSE', departmentid: defaultDept.departmentid },
    { name: 'BS Electrical Engineering', code: 'BSEE', departmentid: departments.length > 1 ? departments[1].departmentid : defaultDept.departmentid },
    { name: 'BBA Business Administration', code: 'BBA', departmentid: defaultDept.departmentid },
    { name: 'MS Data Science', code: 'MSDS', departmentid: defaultDept.departmentid },
    { name: 'BS Artificial Intelligence', code: 'BSAI', departmentid: defaultDept.departmentid },
  ];

  for (const prog of programsToCreate) {
    const exists = await prisma.program.findFirst({ where: { name: prog.name } });
    if (!exists) {
      await prisma.program.create({ data: prog });
      console.log(`Created program: ${prog.name}`);
    } else {
      console.log(`Program already exists: ${prog.name}`);
    }
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
