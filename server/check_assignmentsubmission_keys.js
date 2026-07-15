import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const model = Prisma.dmmf.datamodel.models.find(m => m.name === 'assignmentsubmission');
  console.log('Fields:', model?.fields.map(f => f.name));
}
main().catch(console.error).finally(() => prisma.$disconnect());
