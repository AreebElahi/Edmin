import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
console.log("Has payroll in prisma:", !!(prisma as any).payroll);
console.log("Has gender in user:", !!(prisma.user.fields?.gender)); // Prisma doesn't have fields at runtime like this, but I'll query one user.

async function checkFields() {
    const user = await prisma.user.findFirst();
    if (user) {
        console.log("User fields:", Object.keys(user));
    }
}
checkFields().finally(() => prisma.$disconnect());
