import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
    const p = await prisma.payroll.findFirst();
    console.log("Payroll record:", p);
}
run().finally(() => prisma.$disconnect());
