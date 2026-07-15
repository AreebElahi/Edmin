const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
async function seedUser4() {
    const passwordHash = await bcrypt.hash('password123', 10);
    const hrRole = await prisma.role.findUnique({ where: { name: 'HR' } });
    let user4 = await prisma.user.upsert({
        where: { username: 'hr_user4' },
        update: { institutionalEmail: 'user4@edmin.com', password: passwordHash, role: 'HR', accountStatus: 'ACTIVE' },
        create: { username: 'hr_user4', institutionalEmail: 'user4@edmin.com', email: 'user4@edmin.com', password: passwordHash, role: 'HR', accountStatus: 'ACTIVE' }
    });
    if (hrRole) {
        await prisma.userRole.upsert({
            where: { user_id_role_id: { user_id: user4.userid, role_id: hrRole.id } },
            update: {},
            create: { user_id: user4.userid, role_id: hrRole.id }
        });
    }
    console.log('Seeded user4 HR');
}
seedUser4().finally(() => prisma.$disconnect());
