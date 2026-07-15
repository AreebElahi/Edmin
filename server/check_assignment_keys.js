import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Let's create an assessmentresult linked to an assignment
  const dummy = await prisma.assignment.findFirst({
    include: { assessmentresult: true }
  }).catch(e => {
    console.error('Error including assessmentresult:', e.message);
  });
  console.log('Dummy:', dummy);
}
main().catch(console.error).finally(() => prisma.$disconnect());
