import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();

async function main() {
    const hrRole = await prisma.role.findUnique({ where: { name: 'HR' } });
    if (!hrRole) {
        console.log('HR role not found');
        return;
    }
    const permsToGrant = [
        { module: 'ADMIN_ROUTES', action: 'ACCESS' },
        { module: 'USERS', action: 'READ' },
        { module: 'DEPARTMENTS', action: 'READ' },
        { module: 'FINANCE', action: 'READ' },
        { module: 'REPORTS', action: 'READ' }
    ];
    const allPerms = await prisma.permission.findMany();
    for (const perm of permsToGrant) {
        const p = allPerms.find(x => x.module === perm.module && x.action === perm.action);
        if (p) {
            await prisma.rolePermission.upsert({
                where: { role_id_permission_id: { role_id: hrRole.id, permission_id: p.id } },
                update: {},
                create: { role_id: hrRole.id, permission_id: p.id }
            });
            console.log(`Granted ${perm.module}:${perm.action} to HR`);
        }
    }

    try {
        const redis = new Redis();
        await redis.flushall();
        console.log('Redis cache flushed.');
        redis.disconnect();
    } catch (e) {
        console.error('Failed to flush redis', e);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
