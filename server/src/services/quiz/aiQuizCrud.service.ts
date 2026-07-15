import prisma from '../../config/prisma.js';

/**
 * AI Quiz CRUD Service — Prisma queries for AI quiz management
 */

// ===== QUIZ CRUD =====

export const createAIQuiz = async (data: {
  title: string;
  description?: string;
  facultyid: number;
  courseofferingid?: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  questiontype: 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  questioncount: number;
  timelimitminutes: number;
  topic: string;
  maxwarnings: number;
  pdfurl?: string;
  pdfpages?: number;
  firebase_id?: string;
  regeneration_count?: number;
  ai_model?: string;
  status?: 'DRAFT' | 'PUBLISHED';
  questions: {
    questiontext: string;
    options: string[];
    correctanswer: string;
    type: 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  }[];
}) => {
  return prisma.$transaction(async (tx) => {
    const quiz = await tx.aiquiz.create({
      data: {
        title: data.title,
        description: data.description || null,
        facultyid: data.facultyid,
        courseofferingid: data.courseofferingid || null,
        difficulty: data.difficulty,
        questiontype: data.questiontype,
        questioncount: data.questioncount,
        timelimitminutes: data.timelimitminutes,
        topic: data.topic,
        maxwarnings: data.maxwarnings,
        pdfurl: data.pdfurl,
        pdfpages: data.pdfpages,
        firebase_id: data.firebase_id,
        regeneration_count: data.regeneration_count || 0,
        ai_model: data.ai_model || 'gemini-2.5-flash',
        status: data.status || 'DRAFT',
      },
    });

    // Create questions in bulk
    const questionData = data.questions.map((q, index) => {
      let mappedType = q.type as string;
      if (mappedType === 'SHORT' || mappedType === 'short' || mappedType === 'short_answer') mappedType = 'SHORT_ANSWER';
      if (mappedType === 'TF' || mappedType === 'true_false' || mappedType === 'True/False') mappedType = 'TRUE_FALSE';
      if (mappedType === 'mcq' || mappedType === 'multiple_choice') mappedType = 'MCQ';
      if (!['MCQ', 'TRUE_FALSE', 'SHORT_ANSWER'].includes(mappedType)) mappedType = 'MCQ'; // safe fallback
      
      return {
        aiquizid: quiz.aiquizid,
        questionorder: index + 1,
        type: mappedType as 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER',
        questiontext: q.questiontext,
        options: q.options as any,
        correctanswer: q.correctanswer,
        points: 1,
      };
    });

    await tx.aiquizquestion.createMany({ data: questionData });

    return tx.aiquiz.findUnique({
      where: { aiquizid: quiz.aiquizid },
      include: { questions: { orderBy: { questionorder: 'asc' } } },
    });
  }, {
    maxWait: 10000, // default: 2000
    timeout: 30000, // default: 5000
  });
};

export const updateAIQuiz = async (quizId: number, data: {
  title: string;
  description?: string;
  courseofferingid?: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  questiontype: 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  questioncount: number;
  timelimitminutes: number;
  topic: string;
  maxwarnings: number;
  status?: 'DRAFT' | 'PUBLISHED';
  questions: {
    questiontext: string;
    options: string[];
    correctanswer: string;
    type: 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  }[];
}) => {
  return prisma.$transaction(async (tx) => {
    // 1. Update main quiz row
    const quiz = await tx.aiquiz.update({
      where: { aiquizid: quizId },
      data: {
        title: data.title,
        description: data.description || null,
        courseofferingid: data.courseofferingid || null,
        difficulty: data.difficulty,
        questiontype: data.questiontype,
        questioncount: data.questioncount,
        timelimitminutes: data.timelimitminutes,
        topic: data.topic,
        maxwarnings: data.maxwarnings,
        status: data.status || 'DRAFT',
        updatedat: new Date(),
      },
    });

    // 2. Delete existing questions
    await tx.aiquizquestion.deleteMany({
      where: { aiquizid: quizId },
    });

    // 3. Create new questions
    const questionData = data.questions.map((q, index) => {
      let mappedType = q.type as string;
      if (mappedType === 'SHORT' || mappedType === 'short' || mappedType === 'short_answer') mappedType = 'SHORT_ANSWER';
      if (mappedType === 'TF' || mappedType === 'true_false' || mappedType === 'True/False') mappedType = 'TRUE_FALSE';
      if (mappedType === 'mcq' || mappedType === 'multiple_choice') mappedType = 'MCQ';
      if (!['MCQ', 'TRUE_FALSE', 'SHORT_ANSWER'].includes(mappedType)) mappedType = 'MCQ';
      
      return {
        aiquizid: quiz.aiquizid,
        questionorder: index + 1,
        type: mappedType as 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER',
        questiontext: q.questiontext,
        options: q.options as any,
        correctanswer: q.correctanswer,
        points: 1,
      };
    });

    await tx.aiquizquestion.createMany({ data: questionData });

    return tx.aiquiz.findUnique({
      where: { aiquizid: quiz.aiquizid },
      include: { questions: { orderBy: { questionorder: 'asc' } } },
    });
  }, {
    maxWait: 10000,
    timeout: 30000,
  });
};

export const getAIQuizById = async (quizId: number, includeAnswers = true) => {
  const quiz = await prisma.aiquiz.findUnique({
    where: { aiquizid: quizId },
    include: {
      questions: {
        orderBy: { questionorder: 'asc' },
        ...(includeAnswers ? {} : { select: {
          aiquizquestionid: true,
          aiquizid: true,
          questionorder: true,
          type: true,
          questiontext: true,
          options: true,
          points: true,
          createdat: true,
          // Exclude correctanswer
        }}),
      },
      faculty: { select: { fullname: true } },
      courseoffering: { include: { course: { select: { name: true, code: true } } } },
      _count: includeAnswers ? { select: { attempts: true } } : undefined,
    },
  });
  if (quiz && !includeAnswers) {
    // Strip generation metadata from students
    const { topic, pdfurl, ai_model, regeneration_count, firebase_id, ...studentSafeQuiz } = quiz;
    return studentSafeQuiz;
  }
  return quiz;
};

export const getAIQuizzesByFaculty = async (facultyId: number) => {
  return prisma.aiquiz.findMany({
    where: { facultyid: facultyId, isactive: true },
    include: {
      courseoffering: { include: { course: { select: { name: true, code: true } } } },
      _count: { select: { attempts: true, questions: true } },
    },
    orderBy: { createdat: 'desc' },
  });
};

export const getPublishedAIQuizzes = async (studentId?: number) => {
  const offerings = studentId 
    ? await prisma.courseenrollment.findMany({ where: { studentid: studentId }, select: { courseofferingid: true } })
    : [];

  const quizzes = await prisma.aiquiz.findMany({
    where: { 
      status: 'PUBLISHED', 
      isactive: true,
      ...(studentId ? {
        courseofferingid: { in: offerings.map(o => o.courseofferingid) },
      } : {})
    },
    include: {
      faculty: { select: { fullname: true } },
      courseoffering: { include: { course: { select: { name: true, code: true } } } },
      _count: { select: { questions: true } },
      attempts: studentId
        ? { where: { studentid: studentId }, select: { aiquizattemptid: true, status: true, score: true } }
        : false,
      reattemptgrants: studentId
        ? { where: { studentid: studentId, used: false } }
        : false,
    },
    orderBy: { createdat: 'desc' },
  });
  return quizzes.map(q => {
    // Strip generation metadata from students
    const { topic, pdfurl, ai_model, regeneration_count, firebase_id, ...studentSafeQuiz } = q;
    return studentSafeQuiz;
  });
};

export const updateAIQuizStatus = async (quizId: number, status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') => {
  return prisma.aiquiz.update({
    where: { aiquizid: quizId },
    data: { status, updatedat: new Date() },
  });
};

export const deleteAIQuiz = async (quizId: number) => {
  return prisma.aiquiz.update({
    where: { aiquizid: quizId },
    data: { isactive: false, pdfurl: null, updatedat: new Date() },
  });
};

// ===== ATTEMPTS =====

export const getQuizAttempts = async (quizId: number) => {
  return prisma.aiquizattempt.findMany({
    where: { aiquizid: quizId },
    include: {
      student: { select: { studentid: true, fullname: true, rollnumber: true } },
    },
    orderBy: { startedat: 'desc' },
  });
};

export const startAttempt = async (quizId: number, studentId: number) => {
  // Check if student already has an in-progress attempt
  const existing = await prisma.aiquizattempt.findFirst({
    where: { aiquizid: quizId, studentid: studentId, status: 'IN_PROGRESS' },
  });

  if (existing) return existing;

  // Check if student already completed and has no reattempt grant
  const completed = await prisma.aiquizattempt.findFirst({
    where: {
      aiquizid: quizId,
      studentid: studentId,
      status: { in: ['SUBMITTED', 'AUTO_SUBMITTED'] },
    },
  });

  if (completed) {
    // Mark grant as used atomically to prevent race condition
    const grantUpdate = await prisma.aiquizreattemptgrant.updateMany({
      where: { aiquizid: quizId, studentid: studentId, used: false },
      data: { used: true },
    });

    if (grantUpdate.count === 0) {
      throw new Error('You have already completed this quiz. Request a reattempt from your instructor.');
    }
  }

  return prisma.aiquizattempt.create({
    data: {
      aiquizid: quizId,
      studentid: studentId,
      answers: {},
    },
  });
};

export const submitAttempt = async (
  attemptId: number,
  answers: Record<string, string>,
  violationCount: number,
  autoSubmit = false
) => {
  // Get the attempt with quiz questions
  const attempt = await prisma.aiquizattempt.findUnique({
    where: { aiquizattemptid: attemptId },
    include: { aiquiz: { include: { questions: true } } },
  });

  if (!attempt) throw new Error('Attempt not found');
  if (attempt.status !== 'IN_PROGRESS') throw new Error('Attempt already submitted');

  // Score the attempt
  const questions = attempt.aiquiz.questions;
  let correctCount = 0;

  for (const q of questions) {
    const studentAnswer = answers[String(q.aiquizquestionid)];
    if (studentAnswer && studentAnswer.trim().toLowerCase() === q.correctanswer.trim().toLowerCase()) {
      correctCount++;
    }
  }

  const totalQuestions = questions.length;
  const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
  const accuracy = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

  return prisma.aiquizattempt.update({
    where: { aiquizattemptid: attemptId },
    data: {
      answers: answers as any,
      score,
      accuracy,
      violationcount: violationCount,
      status: autoSubmit ? 'AUTO_SUBMITTED' : 'SUBMITTED',
      submittedat: new Date(),
    },
    include: {
      aiquiz: { select: { title: true, questioncount: true } },
      student: { select: { fullname: true } },
    },
  });
};

export const updateViolationCount = async (attemptId: number, count: number) => {
  return prisma.aiquizattempt.update({
    where: { aiquizattemptid: attemptId },
    data: { violationcount: count },
  });
};

export const getAttemptById = async (attemptId: number, isFaculty = false) => {
  const attempt = await prisma.aiquizattempt.findUnique({
    where: { aiquizattemptid: attemptId },
    include: {
      aiquiz: { include: { questions: { orderBy: { questionorder: 'asc' } } } },
      student: { select: { studentid: true, fullname: true, rollnumber: true } },
    },
  });

  if (attempt && !isFaculty) {
    // Strip generation metadata from students
    const { topic, ...studentSafeQuiz } = attempt.aiquiz;
    return { ...attempt, aiquiz: studentSafeQuiz };
  }
  return attempt;
};

// ===== REATTEMPT GRANTS =====

export const grantReattempt = async (
  quizId: number,
  studentId: number,
  grantedBy: number,
  reason?: string
) => {
  return prisma.aiquizreattemptgrant.create({
    data: {
      aiquizid: quizId,
      studentid: studentId,
      grantedby: grantedBy,
      reason: reason || null,
    },
  });
};
