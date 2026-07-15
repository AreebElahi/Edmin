import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.hrprofile.findMany().then(profiles => {
    console.log("HR Profiles:", profiles);
}).finally(() => prisma.$disconnect());
