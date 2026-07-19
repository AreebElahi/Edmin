import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.count();
  const students = await prisma.student.count();
  const faculty = await prisma.faculty.count();
  const courses = await prisma.course.count();
  const assignments = await prisma.assignment.count();
  const quizzes = await prisma.quiz.count();
  const quizquestions = await prisma.quizquestion.count();
  const enrollments = await prisma.courseenrollment.count();
  const leaves = await prisma.leaverequest.count();
  
  console.log({
    users,
    students,
    faculty,
    courses,
    assignments,
    quizzes,
    enrollments,
    leaves
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
