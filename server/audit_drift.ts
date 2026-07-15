import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import Redis from 'ioredis';

async function main() {
    console.log("=== DB Drift Audit ===");
    
    // Check Assignment 6
    const assignment6 = await prisma.assignment.findUnique({ where: { assignmentid: 6 } });
    if (assignment6) {
        console.log(`Assignment 6: duedate=${assignment6.duedate}, status=${assignment6.status}`);
    } else {
        console.log("Assignment 6 not found.");
    }
    
    // Check Quiz with PDF URLs
    const quizzes = await prisma.aiquiz.findMany({ where: { pdfurl: { not: null } } });
    console.log(`\nQuizzes with PDF URLs: ${quizzes.length}`);
    for (const q of quizzes) {
        console.log(` - Quiz ${q.aiquizid}: pdfurl=${q.pdfurl}`);
    }

    // Check Users with drift (if any we know of, e.g. user1@edmin.com)
    const user1 = await prisma.user.findFirst({ where: { institutionalEmail: 'user1@edmin.com' } });
    if (user1) {
        const roles = await prisma.rolePermission.findMany({
            where: { role_id: 1 } // assuming role mapping or whatever user has
        });
        console.log(`\nUser1: email=${user1.institutionalEmail}, role=${user1.role}`);
    } else {
        console.log("\nUser1 not found.");
    }

    // Check Redis Keys
    const redis = new Redis();
    try {
        const keys = await redis.keys('*');
        console.log(`\nRedis Keys (${keys.length}):`);
        console.log(keys.join(', '));
    } catch(e) {
        console.log("Redis not running or reachable.", e);
    } finally {
        redis.disconnect();
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
