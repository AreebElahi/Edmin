import prisma from '../../config/prisma.js';

export const findQuizzesByStudent = async (userId: number) => {
  const enrollments = await prisma.courseenrollment.findMany({
    where: { student: { userid: userId }, isactive: true },
    select: { courseofferingid: true },
  });

  const offeringIds = enrollments.map((e) => e.courseofferingid);

  return prisma.quiz.findMany({
    where: {
      courseofferingid: { in: offeringIds },
      isactive: true,
    },
    select: {
      quizid: true,
      title: true,
      duration: true,
      totalmarks: true,
      courseoffering: {
        select: { course: { select: { code: true, name: true } } },
      },
      quizattempt: {
        where: { student: { userid: userId }, isactive: true },
        select: { quizattemptid: true, score: true, submittedat: true },
      },
    },
    orderBy: { createdat: 'asc' },
  });
};

export const findQuizById = async (quizId: number) => {
  return prisma.quiz.findFirst({
    where: { quizid: quizId, isactive: true },
    select: {
      quizid: true,
      courseofferingid: true,
      title: true,
      totalmarks: true,
      duration: true,
      courseoffering: {
        select: {
          course: { select: { code: true, name: true } },
          courseenrollment: {
            where: { isactive: true },
            select: { studentid: true },
          },
        },
      },
      quizquestion: {
        where: { isactive: true },
        select: {
          points: true,
          questionbank: {
            select: {
              questionbankid: true,
              questiontext: true,
              type: true,
              quizoption: {
                where: { isactive: true },
                select: {
                  quizoptionid: true,
                  optiontext: true,
                  iscorrect: true,
                },
              },
            },
          },
        },
      },
    },
  });
};

export const findQuizAttempt = async (studentId: number, quizId: number) => {
  return prisma.quizattempt.findFirst({
    where: {
      studentid: studentId,
      quizid: quizId,
      isactive: true,
    },
    include: {
      quizanswer: {
        include: {
          questionbank: {
            include: {
              quizoption: {
                where: { isactive: true },
              },
            },
          },
        },
      },
    },
  });
};

export const createQuizAttempt = async (
  studentId: number,
  quizId: number,
  score: number,
  answers: { questionId: number; selectedOptionId: number; marksAwarded: number }[]
) => {
  return prisma.quizattempt.create({
    data: {
      quizid: quizId,
      studentid: studentId,
      score,
      startedat: new Date(),
      submittedat: new Date(),
      quizanswer: {
        create: answers.map((ans) => ({
          questionbankid: ans.questionId,
          selectedoptionid: ans.selectedOptionId,
          marksawarded: ans.marksAwarded,
        })),
      },
    },
  });
};
