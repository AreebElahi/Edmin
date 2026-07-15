import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();

async function run() {
    const passwordHash = await bcrypt.hash('password123', 10);
    const hr = await prisma.user.findFirst({ where: { role: 'HR' } });
    if (hr) {
        await prisma.user.update({
            where: { userid: hr.userid },
            data: { password: passwordHash }
        });
        console.log("Password reset to 'password123' for HR user:", hr.email);
    } else {
        console.log("No HR user found");
    }
}
run().finally(() => prisma.$disconnect());
