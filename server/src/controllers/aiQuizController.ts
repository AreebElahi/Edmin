import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { eventBus, Events } from '../events/eventBus.js';
import catchAsync from '../utils/catchAsync.js';
import prisma from '../config/prisma.js';
import * as aiQuizService from '../services/quiz/aiQuiz.service.js';
import * as aiQuizCrud from '../services/quiz/aiQuizCrud.service.js';
import * as storageService from '../services/storage.service.js';
import { deleteFile } from '../services/storage.service.js';


import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

/**
 * POST /api/v1/ai-quiz/generate
 * Faculty: Generate AI quiz questions (preview, not saved)
 */
export const generateQuiz = catchAsync(async (req: Request, res: Response) => {
  const { topic, difficulty, questionType, questionCount, title } = req.body;

  console.log('[AI Quiz] generateQuiz body:', req.body);

  if (!topic || !difficulty || !questionType || !questionCount || !title) {
    console.log('[AI Quiz] Missing fields. topic:', topic, 'difficulty:', difficulty, 'questionType:', questionType, 'questionCount:', questionCount, 'title:', title);
    res.status(400).json({ success: false, error: 'Missing required fields: topic, difficulty, questionType, questionCount, title' });
    return;
  }

  const qCount = parseInt(questionCount, 10);
  if (isNaN(qCount) || qCount < 1 || qCount > 50) {
    console.log('[AI Quiz] Invalid question count:', questionCount);
    res.status(400).json({ success: false, error: 'Question count must be between 1 and 50' });
    return;
  }

  let pdfText = undefined;
  let pdfurl = undefined;
  let pdfpages = undefined;

  if (req.file) {
    if (req.file.mimetype !== 'application/pdf') {
      res.status(400).json({ success: false, error: 'Only PDF files are allowed' });
      return;
    }
    
    try {
      const pdfData = await pdfParse(req.file.buffer);
      if (pdfData.numpages > 120) {
        res.status(400).json({ success: false, error: 'PDF exceeds 120 pages limit' });
        return;
      }
      pdfText = pdfData.text;
      pdfpages = pdfData.numpages;
      
      // Save PDF
      pdfurl = await storageService.saveFile(req.file.buffer, '.pdf');
    } catch (error: any) {
      console.error('[AI Quiz] PDF parse error:', error);
      res.status(400).json({ success: false, error: `Failed to process PDF: ${error.message || 'Invalid format'}` });
      return;
    }
  }

  const questions = await aiQuizService.generateQuestionsWithAI(topic, difficulty, questionType, questionCount, pdfText);

  res.status(200).json({
    success: true,
    data: {
      title,
      topic,
      difficulty,
      pdfurl,
      pdfpages,
      questions,
    },
  });
});

/**
 * POST /api/v1/ai-quiz/save
 * Faculty: Save a generated AI quiz to database
 */
export const saveQuiz = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const {
    title, description, courseOfferingId, difficulty, questionType,
    questionCount, timeLimitMinutes, topic, maxWarnings, questions,
    pdfurl, pdfpages, firebase_id, regeneration_count, ai_model, status
  } = req.body;

  if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
    res.status(400).json({ success: false, error: 'Missing required fields: title, questions' });
    return;
  }

  // Resolve faculty profile
  const faculty = await prisma.faculty.findFirst({ where: { userid: userId } });
  if (!faculty) {
    res.status(403).json({ success: false, error: 'Faculty profile not found' });
    return;
  }

  const quizData = {
    title,
    description,
    facultyid: faculty.facultyid,
    courseofferingid: courseOfferingId ? Number(courseOfferingId) : undefined,
    difficulty: difficulty || 'MEDIUM',
    questiontype: questionType || 'MCQ',
    questioncount: questions.length,
    timelimitminutes: timeLimitMinutes || 30,
    topic: topic || '',
    maxwarnings: maxWarnings ?? 3,
    pdfurl,
    pdfpages,
    firebase_id,
    regeneration_count,
    ai_model,
    status: status || 'DRAFT',
    questions,
  };

  let quiz;
  if (req.body.id) {
    // Update existing quiz
    // Ensure ownership
    const existing = await prisma.aiquiz.findUnique({ 
      where: { aiquizid: Number(req.body.id) },
      include: { _count: { select: { attempts: true } } }
    });
    
    if (!existing || existing.facultyid !== faculty.facultyid) {
      res.status(403).json({ success: false, error: 'Not authorized to update this quiz' });
      return;
    }
    
    if (existing.status !== 'DRAFT' && existing._count.attempts > 0) {
      res.status(400).json({ success: false, error: 'Cannot edit a quiz that has already been attempted by students' });
      return;
    }
    quiz = await aiQuizCrud.updateAIQuiz(Number(req.body.id), quizData as any);
  } else {
    // Create new quiz
    quiz = await aiQuizCrud.createAIQuiz(quizData as any);
  }

  res.status(201).json({ success: true, data: quiz });
});

/**
 * GET /api/v1/ai-quiz/
 * Faculty: list own quizzes; Student: list published quizzes
 */
export const listQuizzes = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const role = req.user.role;

  if (role === 'FACULTY' || role === 'ADMIN' || role === 'SYSTEM_ADMIN') {
    const faculty = await prisma.faculty.findFirst({ where: { userid: userId } });
    if (!faculty) {
      res.status(403).json({ success: false, error: 'Faculty profile not found' });
      return;
    }
    const quizzes = await aiQuizCrud.getAIQuizzesByFaculty(faculty.facultyid);
    res.status(200).json({ success: true, data: quizzes });
  } else {
    // Student
    const student = await prisma.student.findFirst({ where: { userid: userId } });
    const quizzes = await aiQuizCrud.getPublishedAIQuizzes(student?.studentid);
    res.status(200).json({ success: true, data: quizzes });
  }
});

/**
 * GET /api/v1/ai-quiz/:id
 * Get quiz by ID (faculty sees answers, student doesn't)
 */
export const getQuiz = catchAsync(async (req: Request, res: Response) => {
  const quizId = parseInt(req.params.id as string, 10);
  const role = req.user.role;

  const isFaculty = role === 'FACULTY' || role === 'ADMIN' || role === 'SYSTEM_ADMIN';
  const quiz = await aiQuizCrud.getAIQuizById(quizId, isFaculty);

  if (!quiz || !quiz.isactive) {
    res.status(404).json({ success: false, error: 'Quiz not found' });
    return;
  }

  res.status(200).json({ success: true, data: quiz });
});

/**
 * PUT /api/v1/ai-quiz/:id/status
 * Faculty: update quiz status (publish/archive)
 */
export const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const quizId = parseInt(req.params.id as string, 10);
  const { status } = req.body;

  if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
    res.status(400).json({ success: false, error: 'Invalid status. Must be DRAFT, PUBLISHED, or ARCHIVED' });
    return;
  }

  const userId = req.user.userId;
  const faculty = await prisma.faculty.findFirst({ where: { userid: userId } });
  
  if (!faculty) {
    res.status(403).json({ success: false, error: 'Faculty profile not found' });
    return;
  }

  const existing = await prisma.aiquiz.findUnique({ where: { aiquizid: quizId } });
  if (!existing || existing.facultyid !== faculty.facultyid) {
    res.status(403).json({ success: false, error: 'Not authorized to update this quiz' });
    return;
  }

  const quiz = await aiQuizCrud.updateAIQuizStatus(quizId, status);

  if (status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
    eventBus.emit(Events.QUIZ_PUBLISHED, {
      quizId: quiz.aiquizid,
      courseOfferingId: quiz.courseofferingid,
      title: quiz.title
    });
  }

  res.status(200).json({ success: true, data: quiz });
});

/**
 * DELETE /api/v1/ai-quiz/:id
 * Faculty: soft-delete quiz
 */
export const deleteQuiz = catchAsync(async (req: Request, res: Response) => {
  const quizId = parseInt(req.params.id as string, 10);
  
  const userId = req.user.userId;
  const faculty = await prisma.faculty.findFirst({ where: { userid: userId } });
  
  if (!faculty) {
    res.status(403).json({ success: false, error: 'Faculty profile not found' });
    return;
  }

  const existing = await prisma.aiquiz.findUnique({ where: { aiquizid: quizId } });
  if (!existing || existing.facultyid !== faculty.facultyid) {
    res.status(403).json({ success: false, error: 'Not authorized to delete this quiz' });
    return;
  }

  await aiQuizCrud.deleteAIQuiz(quizId);
  
  if (existing.pdfurl) {
    await deleteFile(existing.pdfurl).catch(e => console.error("Failed to delete quiz PDF:", e));
  }
  
  res.status(200).json({ success: true, message: 'Quiz deleted' });
});

/**
 * GET /api/v1/ai-quiz/:id/attempts
 * Faculty: get all student attempts for a quiz (gradebook)
 */
export const getAttempts = catchAsync(async (req: Request, res: Response) => {
  const quizId = parseInt(req.params.id as string, 10);
  
  const userId = req.user.userId;
  const faculty = await prisma.faculty.findFirst({ where: { userid: userId } });
  
  if (!faculty) {
    res.status(403).json({ success: false, error: 'Faculty profile not found' });
    return;
  }

  const existing = await prisma.aiquiz.findUnique({ where: { aiquizid: quizId } });
  if (!existing || existing.facultyid !== faculty.facultyid) {
    res.status(403).json({ success: false, error: 'Not authorized to view attempts for this quiz' });
    return;
  }

  const attempts = await aiQuizCrud.getQuizAttempts(quizId);
  res.status(200).json({ success: true, data: attempts });
});

/**
 * POST /api/v1/ai-quiz/:id/attempt
 * Student: start a quiz attempt
 */
export const startAttempt = catchAsync(async (req: Request, res: Response) => {
  const quizId = parseInt(req.params.id as string, 10);
  const userId = req.user.userId;

  const student = await prisma.student.findFirst({ where: { userid: userId } });
  if (!student) {
    res.status(403).json({ success: false, error: 'Student profile not found' });
    return;
  }

  // Verify quiz is published
  const quiz = await prisma.aiquiz.findUnique({ where: { aiquizid: quizId } });
  if (!quiz || quiz.status !== 'PUBLISHED' || !quiz.isactive) {
    res.status(404).json({ success: false, error: 'Quiz not found or not available' });
    return;
  }

  try {
    const attempt = await aiQuizCrud.startAttempt(quizId, student.studentid);
    res.status(201).json({ success: true, data: attempt });
  } catch (error: any) {
    res.status(409).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/v1/ai-quiz/:id/attempt/:attemptId
 * Student: submit attempt or update violations
 */
export const submitAttempt = catchAsync(async (req: Request, res: Response) => {
  const attemptId = parseInt(req.params.attemptId as string, 10);
  const { answers, violationCount, autoSubmit } = req.body;

  try {
    const result = await aiQuizCrud.submitAttempt(
      attemptId,
      answers || {},
      violationCount || 0,
      autoSubmit || false
    );
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/v1/ai-quiz/:id/attempt/:attemptId/violation
 * Student: update violation count
 */
export const updateViolation = catchAsync(async (req: Request, res: Response) => {
  const attemptId = parseInt(req.params.attemptId as string, 10);
  const { violationCount } = req.body;

  const result = await aiQuizCrud.updateViolationCount(attemptId, violationCount || 0);
  res.status(200).json({ success: true, data: result });
});

/**
 * GET /api/v1/ai-quiz/attempt/:attemptId
 * Get attempt details (for result page)
 */
export const getAttemptDetails = catchAsync(async (req: Request, res: Response) => {
  const attemptId = parseInt(req.params.attemptId as string, 10);
  const attempt = await aiQuizCrud.getAttemptById(attemptId);

  if (!attempt) {
    res.status(404).json({ success: false, error: 'Attempt not found' });
    return;
  }

  res.status(200).json({ success: true, data: attempt });
});

/**
 * POST /api/v1/ai-quiz/:id/reattempt
 * Faculty: grant reattempt to a student
 */
export const grantReattempt = catchAsync(async (req: Request, res: Response) => {
  const quizId = parseInt(req.params.id as string, 10);
  const { studentId, reason } = req.body;
  const userId = req.user.userId;

  if (!studentId) {
    res.status(400).json({ success: false, error: 'Student ID is required' });
    return;
  }

  const grant = await aiQuizCrud.grantReattempt(quizId, Number(studentId), userId, reason);
  res.status(201).json({ success: true, data: grant });
});

/**
 * POST /api/v1/ai-quiz/regenerate
 * Faculty: Regenerate a single AI question
 */
export const regenerateQuestion = catchAsync(async (req: Request, res: Response) => {
  const { topic, difficulty, questionType, oldQuestionText, pdfurl } = req.body;

  if (!topic || !difficulty || !questionType || !oldQuestionText) {
    res.status(400).json({ success: false, error: 'Missing required fields' });
    return;
  }

  let pdfText = undefined;
  if (pdfurl) {
    try {
      const buffer = await storageService.readFile(pdfurl);
      const pdfData = await pdfParse(buffer);
      pdfText = pdfData.text;
    } catch (err) {
      console.warn('[AI Quiz] Regenerate failed to read PDF context:', err);
    }
  }

  const question = await aiQuizService.regenerateQuestionWithAI(
    topic,
    difficulty,
    questionType,
    oldQuestionText,
    pdfText
  );

  res.status(200).json({ success: true, data: question });
});
