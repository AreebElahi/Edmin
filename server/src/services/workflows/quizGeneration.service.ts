import prisma from '../../config/prisma.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configFilePath = path.resolve(__dirname, '../../controllers/admin/systemConfig.json');

// Get max quiz questions limit from config
const getMaxQuestionsLimit = () => {
  try {
    if (fs.existsSync(configFilePath)) {
      const config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
      return config.maxQuizQuestions || 50;
    }
  } catch (error) {
    console.error('Failed to read settings config', error);
  }
  return 50;
};

export const generateQuizMCQs = async (
  userId: number,
  courseOfferingId: number,
  title: string,
  topic: string,
  difficulty: 'EASY' | 'MEDIUM' | 'HARD',
  questionCount: number
) => {
  // 1. Validation
  const maxLimit = getMaxQuestionsLimit();
  if (questionCount <= 0 || questionCount > maxLimit) {
    throw new Error(`Question count must be between 1 and ${maxLimit} (configured limit)`);
  }

  const allowedDifficulties = ['EASY', 'MEDIUM', 'HARD'];
  if (!allowedDifficulties.includes(difficulty)) {
    throw new Error('Difficulty must be EASY, MEDIUM, or HARD');
  }

  // 2. Resolve offering & faculty
  const offering = await prisma.courseoffering.findUnique({
    where: { courseofferingid: courseOfferingId },
    include: { course: true }
  });

  if (!offering) throw new Error('Course offering not found');

  const faculty = await prisma.faculty.findFirst({
    where: { userid: userId }
  });

  if (!faculty) throw new Error('Faculty profile not found');

  // 3. Resolve or create a default question category for this department
  let categoryId = 1;
  const deptId = offering.departmentid;
  const existingCategory = await prisma.questioncategory.findFirst({
    where: { departmentid: deptId }
  });

  if (existingCategory) {
    categoryId = existingCategory.questioncategoryid;
  } else {
    const newCategory = await prisma.questioncategory.create({
      data: {
        name: `${offering.course.name} Category`,
        departmentid: deptId
      }
    });
    categoryId = newCategory.questioncategoryid;
  }

  // 4. Generate deterministic questions depending on topic
  const mcqs = generateDeterministicQuestions(topic, difficulty, questionCount);

  // 5. Database transaction to create Quiz, QuestionBank, Options and QuizQuestions
  return await prisma.$transaction(async (tx) => {
    // Create Quiz
    const quiz = await tx.quiz.create({
      data: {
        courseofferingid: courseOfferingId,
        title,
        duration: questionCount * 2, // 2 minutes per question
        totalmarks: questionCount * 2, // 2 marks per question
        metadata: {
          generatedBy: userId,
          generatedAt: new Date().toISOString(),
          difficulty,
          topic,
          questionCount
        }
      }
    });

    for (const item of mcqs) {
      // Create Question Bank entry
      const question = await tx.questionbank.create({
        data: {
          categoryid: categoryId,
          difficulty: difficulty,
          questiontext: item.question,
          type: 'MCQ'
        }
      });

      // Create Options
      for (const opt of item.options) {
        await tx.quizoption.create({
          data: {
            questionbankid: question.questionbankid,
            optiontext: opt.text,
            iscorrect: opt.isCorrect
          }
        });
      }

      // Link to Quiz
      await tx.quizquestion.create({
        data: {
          quizid: quiz.quizid,
          questionbankid: question.questionbankid,
          points: 2
        }
      });
    }

    return quiz;
  });
};

// Generates MCQs deterministically based on topic and difficulty
const generateDeterministicQuestions = (topic: string, difficulty: string, count: number) => {
  const list = [];
  const lowercaseTopic = topic.toLowerCase();

  for (let i = 1; i <= count; i++) {
    let questionText = '';
    let options = [];

    if (lowercaseTopic.includes('oop') || lowercaseTopic.includes('object')) {
      if (i % 3 === 1) {
        questionText = `[OOP ${difficulty} Q${i}] Which concept allows one class to inherit the behaviors of another?`;
        options = [
          { text: 'Inheritance', isCorrect: true },
          { text: 'Encapsulation', isCorrect: false },
          { text: 'Polymorphism', isCorrect: false },
          { text: 'Abstraction', isCorrect: false }
        ];
      } else if (i % 3 === 2) {
        questionText = `[OOP ${difficulty} Q${i}] What is the primary purpose of encapsulation in Object-Oriented programming?`;
        options = [
          { text: 'To reuse code via parent classes', isCorrect: false },
          { text: 'To restrict direct access to object states', isCorrect: true },
          { text: 'To allow multiple forms of a method', isCorrect: false },
          { text: 'To run code concurrently', isCorrect: false }
        ];
      } else {
        questionText = `[OOP ${difficulty} Q${i}] Polymorphism in OOP is typically implemented through which mechanism?`;
        options = [
          { text: 'Method Overriding and Overloading', isCorrect: true },
          { text: 'Constructors', isCorrect: false },
          { text: 'Global variables', isCorrect: false },
          { text: 'Static methods', isCorrect: false }
        ];
      }
    } 
    else if (lowercaseTopic.includes('database') || lowercaseTopic.includes('sql')) {
      if (i % 3 === 1) {
        questionText = `[DB ${difficulty} Q${i}] Which SQL clause is used to filter records after aggregation?`;
        options = [
          { text: 'WHERE', isCorrect: false },
          { text: 'HAVING', isCorrect: true },
          { text: 'GROUP BY', isCorrect: false },
          { text: 'ORDER BY', isCorrect: false }
        ];
      } else if (i % 3 === 2) {
        questionText = `[DB ${difficulty} Q${i}] What does ACID stand for in DBMS transactions?`;
        options = [
          { text: 'Atomicity, Consistency, Isolation, Durability', isCorrect: true },
          { text: 'Access, Control, Index, Database', isCorrect: false },
          { text: 'Active, Current, Internal, Data', isCorrect: false },
          { text: 'Atomicity, Connection, Isolation, Deployment', isCorrect: false }
        ];
      } else {
        questionText = `[DB ${difficulty} Q${i}] A primary key constraint enforces which of the following rules?`;
        options = [
          { text: 'Unique values and no NULL values', isCorrect: true },
          { text: 'Unique values but allows one NULL', isCorrect: false },
          { text: 'Values must match a foreign key', isCorrect: false },
          { text: 'Values must be numeric', isCorrect: false }
        ];
      }
    } 
    else {
      // Fallback generic topic question generator
      questionText = `[${topic} ${difficulty} Q${i}] What is the primary baseline concept of ${topic} at the ${difficulty} level?`;
      options = [
        { text: `Option A: Correct answer for ${topic} question ${i}`, isCorrect: true },
        { text: `Option B: Incorrect answer for ${topic} question ${i}`, isCorrect: false },
        { text: `Option C: Incorrect answer for ${topic} question ${i}`, isCorrect: false },
        { text: `Option D: Incorrect answer for ${topic} question ${i}`, isCorrect: false }
      ];
    }

    list.push({ question: questionText, options });
  }

  return list;
};
