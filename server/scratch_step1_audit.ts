import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const keys = Object.keys(prisma) as string[];

const profileModels = keys.filter(k => k.toLowerCase().includes('profile') || k.toLowerCase().includes('faculty') || k.toLowerCase().includes('hr') || k.toLowerCase().includes('admin') || k.toLowerCase().includes('staff') || k.toLowerCase().includes('employee'));
console.log("Potential profile models:", profileModels);

async function check() {
    for (const model of profileModels) {
        if ((prisma as any)[model] && typeof (prisma as any)[model].findFirst === 'function') {
            try {
                const first = await (prisma as any)[model].findFirst();
                if (first) {
                    console.log(`Fields in ${model}:`, Object.keys(first));
                }
            } catch (e) {}
        }
    }
}
check().finally(() => prisma.$disconnect());
