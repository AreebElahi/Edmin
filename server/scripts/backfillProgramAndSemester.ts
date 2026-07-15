import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting backfill for Programs and Semesters...');

  // 1. Create a default "Fall 2026" semester if it doesn't exist
  let defaultSemester = await prisma.semester.findFirst({
    where: { name: 'Fall 2026' }
  });

  if (!defaultSemester) {
    defaultSemester = await prisma.semester.create({
      data: {
        name: 'Fall 2026',
        year: 2026,
        status: 'UPCOMING',
        isactive: true
      }
    });
    console.log(`Created default semester: Fall 2026 (ID: ${defaultSemester.semesterid})`);
  }

  // 2. For each department, create a generic program if none exists
  const departments = await prisma.department.findMany();
  for (const dept of departments) {
    let program = await prisma.program.findFirst({
      where: { departmentid: dept.departmentid }
    });

    if (!program) {
      program = await prisma.program.create({
        data: {
          name: `General ${dept.name}`,
          code: `${dept.code}-GEN`,
          departmentid: dept.departmentid,
          isactive: true
        }
      });
      console.log(`Created default program: ${program.name} (ID: ${program.programid})`);
    }

    // 3. Backfill sections for this department
    const updatedSections = await prisma.section.updateMany({
      where: {
        departmentid: dept.departmentid,
        programid: null
      },
      data: {
        programid: program.programid,
        semesterid: defaultSemester.semesterid
      }
    });
    console.log(`Backfilled ${updatedSections.count} sections in department ${dept.code}`);

    // 4. Backfill students for this department
    const updatedStudents = await prisma.student.updateMany({
      where: {
        departmentid: dept.departmentid,
        programid: null
      },
      data: {
        programid: program.programid,
        semesterid: defaultSemester.semesterid
      }
    });
    console.log(`Backfilled ${updatedStudents.count} students in department ${dept.code}`);
  }

  console.log('Backfill complete! You can now make programid and semesterid strictly required in schema.prisma if desired.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
