import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log('Seeding Database...');
    // 1. Roles
    const roles = ['ADMIN', 'HR', 'FACULTY', 'STUDENT'];
    for (const roleName of roles) {
        await prisma.role.upsert({
            where: { name: roleName },
            update: {},
            create: { name: roleName, description: `${roleName} Role` }
        });
    }
    // 2. Permissions
    const permissions = [
        { module: 'TICKETS', action: 'READ' },
        { module: 'TICKETS', action: 'UPDATE' },
        { module: 'TICKETS', action: 'DELETE' },
        { module: 'USERS', action: 'READ' },
    ];
    for (const perm of permissions) {
        await prisma.permission.upsert({
            where: { module_action: { module: perm.module, action: perm.action } },
            update: {},
            create: { module: perm.module, action: perm.action }
        });
    }
    // 3. Assign Admin Permissions
    const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
    const allPerms = await prisma.permission.findMany();
    if (adminRole) {
        for (const p of allPerms) {
            await prisma.rolePermission.upsert({
                where: { role_id_permission_id: { role_id: adminRole.id, permission_id: p.id } },
                update: {},
                create: { role_id: adminRole.id, permission_id: p.id }
            });
        }
    }
    console.log('Database seeded successfully!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
