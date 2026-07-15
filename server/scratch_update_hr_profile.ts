import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
    await prisma.hrprofile.updateMany({
        where: { emailaddress: 'user4@edmin.com' },
        data: { fullname: 'Sarah Jenkins' }
    });
    console.log("Updated HR profile fullname");
}
run().finally(() => prisma.$disconnect());
