import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const a = await prisma.assessment.findMany();
    console.log('Assessments count:', a.length);
}
main().finally(() => prisma.$disconnect());
