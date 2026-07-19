import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const quizzes = await prisma.quiz.findMany();
  
  if (quizzes.length === 0) {
    console.log('No quizzes found.');
    return;
  }

  for (const quiz of quizzes) {
    const existingQ = await prisma.quizquestion.findFirst({ where: { quizid: quiz.quizid } });
    if (existingQ) {
      console.log(`Quiz ${quiz.quizid} already has questions.`);
      continue;
    }

    let category = await prisma.questioncategory.findFirst();
    if (!category) {
      category = await prisma.questioncategory.create({
        data: { name: 'General', createdat: new Date(), updatedat: new Date() }
      });
    }

    // Create a questionbank entry
    const qb = await prisma.questionbank.create({
      data: {
        questiontext: 'What is 2 + 2?',
        difficulty: 'EASY',
        questioncategory: { connect: { questioncategoryid: category.questioncategoryid } },
        createdat: new Date(),
        updatedat: new Date(),
        isactive: true,
      }
    });

    // Create options
    await prisma.quizoption.createMany({
      data: [
        { questionbankid: qb.questionbankid, optiontext: '3', iscorrect: false, isactive: true, createdat: new Date(), updatedat: new Date() },
        { questionbankid: qb.questionbankid, optiontext: '4', iscorrect: true, isactive: true, createdat: new Date(), updatedat: new Date() },
      ]
    });

    // Create quizquestion
    await prisma.quizquestion.create({
      data: {
        quizid: quiz.quizid,
        questionbankid: qb.questionbankid,
        points: 10,
        isactive: true,
        createdat: new Date(),
        updatedat: new Date()
      }
    });

    console.log(`Added 1 question to quiz ${quiz.quizid}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
