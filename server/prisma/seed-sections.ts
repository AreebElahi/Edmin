import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const programs = await prisma.program.findMany();
  
  if (programs.length === 0) {
    console.log('No programs found. Please seed programs first.');
    return;
  }

  for (const prog of programs) {
    // Create 2 sections for each program
    for (let i = 1; i <= 2; i++) {
      const sectionName = `${prog.code}-${i}A`;
      
      const exists = await prisma.section.findFirst({ where: { name: sectionName, programid: prog.programid } });
      
      if (!exists) {
        await prisma.section.create({
          data: {
            name: sectionName,
            capacity: 50,
            departmentid: prog.departmentid,
            programid: prog.programid,
            section_sequence: i,
            isactive: true,
            status: 'ACTIVE'
          }
        });
        console.log(`Created section: ${sectionName} for program ${prog.name}`);
      } else {
        console.log(`Section already exists: ${sectionName}`);
      }
    }
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
