import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function audit() {
    try {
        const counts = {
            user: await prisma.user.count(),
            faculty: await prisma.faculty.count(),
            hrprofile: await prisma.hrprofile.count(),
            department: await prisma.department.count(),
            leaverequest: await prisma.leaverequest.count(),
            // I'll check payroll and notification later if needed
        };
        console.log("Database Counts:", counts);

        const roles = await prisma.user.groupBy({
            by: ['role'],
            _count: { role: true }
        });
        console.log("Roles breakdown:", roles);
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}
audit();
