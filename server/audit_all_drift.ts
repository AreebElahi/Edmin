import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("=== DB Full Drift Audit ===");
    
    // Users
    const users = await prisma.user.findMany({
        select: { userid: true, username: true, email: true, createdat: true, role: true }
    });
    console.log(`\nTotal Users: ${users.length}`);
    users.forEach(u => console.log(` - [${u.createdat.toISOString()}] ${u.role}: ${u.username} (${u.email})`));

    // Assignments
    const assignments = await prisma.assignment.findMany({
        select: { assignmentid: true, title: true, createdat: true }
    });
    console.log(`\nTotal Assignments: ${assignments.length}`);
    assignments.forEach(a => console.log(` - [${a.createdat.toISOString()}] ID ${a.assignmentid}: ${a.title}`));

    // Quizzes
    const quizzes = await prisma.aiquiz.findMany({
        select: { aiquizid: true, title: true, createdat: true }
    });
    console.log(`\nTotal Quizzes: ${quizzes.length}`);
    quizzes.forEach(q => console.log(` - [${q.createdat.toISOString()}] ID ${q.aiquizid}: ${q.title}`));

    // Submissions
    const submissions = await prisma.assignmentsubmission.findMany({
        select: { assignmentsubmissionid: true, studentid: true, assignmentid: true, createdat: true }
    });
    console.log(`\nTotal Submissions: ${submissions.length}`);
    submissions.forEach(s => console.log(` - [${s.createdat.toISOString()}] Sub ${s.assignmentsubmissionid} for Assignment ${s.assignmentid}`));
}
main().catch(console.error).finally(() => prisma.$disconnect());
