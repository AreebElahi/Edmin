import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.assignmentsubmission.delete({
    where: { assignmentsubmissionid: 8 }
  });
  console.log('Deleted test row');
}

main().then(() => prisma.$disconnect()).catch(console.error);
