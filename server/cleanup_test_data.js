import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const assignments = await prisma.assignment.findMany({
    where: {
      OR: [
        { title: { contains: 'E2E Test' } },
        { title: { contains: 'Test Assignment' } }
      ]
    }
  });

  console.log(`Found ${assignments.length} test assignments.`);

  for (const a of assignments) {
    console.log(`- Deleting: ${a.title} (ID: ${a.assignmentid})`);
    await prisma.assignment.delete({ where: { assignmentid: a.assignmentid } });
  }

  const submissions = await prisma.assignmentsubmission.findMany({
    where: {
      OR: [
        { fileUrl: { contains: 'test.txt' } },
        { fileUrl: { contains: 'test.zip' } },
        { fileUrl: { contains: 'test.png' } },
        { fileUrl: { contains: 'test_' } }
      ]
    }
  });

  console.log(`Found ${submissions.length} test submissions.`);
  for (const s of submissions) {
    console.log(`- Deleting submission ID: ${s.assignmentsubmissionid}`);
    await prisma.assignmentsubmission.delete({ where: { assignmentsubmissionid: s.assignmentsubmissionid } });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
