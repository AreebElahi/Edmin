import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
const prisma = new PrismaClient();
async function main() {
    const hrRole = await prisma.role.findUnique({ where: { name: 'HR' } });
    const p = await prisma.permission.findFirst({ where: { module: 'FACULTY_OVERSIGHT', action: 'READ' } });
    if (p && hrRole) {
        await prisma.rolePermission.upsert({
            where: { role_id_permission_id: { role_id: hrRole.id, permission_id: p.id } },
            update: {},
            create: { role_id: hrRole.id, permission_id: p.id }
        });
        console.log(`Granted FACULTY_OVERSIGHT:READ to HR`);
    }
    const redis = new Redis();
    await redis.flushall();
    redis.disconnect();
}
main().finally(() => prisma.$disconnect());
