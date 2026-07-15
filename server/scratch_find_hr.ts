import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.user.findFirst({ where: { role: 'HR' } }).then(u => {
    console.log(u);
    return prisma.user.findFirst({ where: { institutionalEmail: 'user4@edmin.com' } });
}).then(u2 => {
    console.log("By email:", u2);
}).finally(() => prisma.$disconnect());
