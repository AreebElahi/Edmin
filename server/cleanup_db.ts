import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  const allSubmissions = await prisma.assignmentsubmission.findMany();
  let deletedCount = 0;
  for (const sub of allSubmissions) {
    if (sub.assignmentsubmissionid === 9 || (sub.fileUrl && sub.fileUrl.includes('test-file'))) {
      await prisma.assignmentsubmission.delete({ where: { assignmentsubmissionid: sub.assignmentsubmissionid } });
      deletedCount++;
    }
  }
  
  const remaining = await prisma.assignmentsubmission.count();
  console.log('Deleted test submissions:', deletedCount);
  console.log('Total remaining assignmentsubmission rows:', remaining);
}

cleanup().catch(console.error).finally(() => prisma.$disconnect());
