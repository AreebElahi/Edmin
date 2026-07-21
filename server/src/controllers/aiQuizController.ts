import { redisConnection } from '../config/redis.js';
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
import { sendSuccess, sendError } from "../contracts/api.contracts.js";
import { getCachedResponse, setCachedResponse } from "../config/redis.js";

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
    sendError(res, 'Internal error', [], 400);
    return;
  }

  const qCount = parseInt(questionCount, 10);
  if (isNaN(qCount) || qCount < 1 || qCount > 50) {
    console.log('[AI Quiz] Invalid question count:', questionCount);
    sendError(res, 'Internal error', [], 400);
    return;
  }

  let pdfText = undefined;
  let pdfurl = undefined;
  let pdfpages = undefined;

  if (req.file) {
    if (req.file.mimetype === 'application/pdf') {
      try {
        const pdfData = await pdfParse(req.file.buffer);
        if (pdfData.numpages > 120) {
          sendError(res, 'Internal error', [], 400);
          return;
        }
        pdfText = pdfData.text;
        pdfpages = pdfData.numpages;
        
        // Save PDF
        pdfurl = await storageService.saveFile(req.file.buffer, '.pdf');
      } catch (error: any) {
        console.error('[AI Quiz] PDF parse error:', error);
        sendError(res, 'Internal error', [], 400);
        return;
      }
    } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        const mammoth = require('mammoth');
        const docxData = await mammoth.extractRawText({ buffer: req.file.buffer });
        pdfText = docxData.value;
        pdfpages = 1; // Default to 1 for DOCX since pagination is dynamic
        
        // Save DOCX
        pdfurl = await storageService.saveFile(req.file.buffer, '.docx');
      } catch (error: any) {
        console.error('[AI Quiz] DOCX parse error:', error);
        sendError(res, 'Internal error', [], 400);
        return;
      }
    } else {
      sendError(res, 'Internal error', [], 400);
      return;
    }
  }

  const questions = await aiQuizService.generateQuestionsWithAI(topic, difficulty, questionType, questionCount, pdfText);

  sendSuccess(res, {
          title,
          topic,
          difficulty,
          pdfurl,
          pdfpages,
          questions,
        }, undefined, undefined, 200);
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
    sendError(res, 'Internal error', [], 400);
    return;
  }

  // Resolve faculty profile
  const faculty = await prisma.faculty.findFirst({ where: { userid: userId } });
  if (!faculty) {
    sendError(res, 'Internal error', [], 403);
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
      sendError(res, 'Internal error', [], 403);
      return;
    }
    
    if (existing.status !== 'DRAFT' && existing._count.attempts > 0) {
      sendError(res, 'Internal error', [], 400);
      return;
    }
    quiz = await aiQuizCrud.updateAIQuiz(Number(req.body.id), quizData as any);
  } else {
    // Create new quiz
    quiz = await aiQuizCrud.createAIQuiz(quizData as any);
  }

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del(`api:faculty:quizzes:${userId}`);
  }

  sendSuccess(res, quiz, undefined, undefined, 201);
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
      sendError(res, 'Internal error', [], 403);
      return;
    }
    const quizzes = await aiQuizCrud.getAIQuizzesByFaculty(faculty.facultyid);
    sendSuccess(res, quizzes, undefined, undefined, 200);
  } else {
    // Student
    const student = await prisma.student.findFirst({ where: { userid: userId } });
    const quizzes = await aiQuizCrud.getPublishedAIQuizzes(student?.studentid);
    sendSuccess(res, quizzes, undefined, undefined, 200);
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
    sendError(res, 'Internal error', [], 404);
    return;
  }

  sendSuccess(res, quiz, undefined, undefined, 200);
});

/**
 * PUT /api/v1/ai-quiz/:id/status
 * Faculty: update quiz status (publish/archive)
 */
export const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const quizId = parseInt(req.params.id as string, 10);
  const { status } = req.body;

  if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
    sendError(res, 'Internal error', [], 400);
    return;
  }

  const userId = req.user.userId;
  const faculty = await prisma.faculty.findFirst({ where: { userid: userId } });
  
  if (!faculty) {
    sendError(res, 'Internal error', [], 403);
    return;
  }

  const existing = await prisma.aiquiz.findUnique({ where: { aiquizid: quizId } });
  if (!existing || existing.facultyid !== faculty.facultyid) {
    sendError(res, 'Internal error', [], 403);
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

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del(`api:faculty:quizzes:${userId}`);
  }

  sendSuccess(res, quiz, undefined, undefined, 200);
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
    sendError(res, 'Internal error', [], 403);
    return;
  }

  const existing = await prisma.aiquiz.findUnique({ where: { aiquizid: quizId } });
  if (!existing || existing.facultyid !== faculty.facultyid) {
    sendError(res, 'Internal error', [], 403);
    return;
  }

  await aiQuizCrud.deleteAIQuiz(quizId);
  
  if (existing.pdfurl) {
    await deleteFile(existing.pdfurl).catch(e => console.error("Failed to delete quiz PDF:", e));
  }
  
  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del(`api:faculty:quizzes:${userId}`);
  }

  sendSuccess(res, { success: true, message: 'Quiz deleted' }, undefined, undefined, 200);
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
    sendError(res, 'Internal error', [], 403);
    return;
  }

  const existing = await prisma.aiquiz.findUnique({ where: { aiquizid: quizId } });
  if (!existing || existing.facultyid !== faculty.facultyid) {
    sendError(res, 'Internal error', [], 403);
    return;
  }

  const attempts = await aiQuizCrud.getQuizAttempts(quizId);
  sendSuccess(res, attempts, undefined, undefined, 200);
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
    sendError(res, 'Internal error', [], 403);
    return;
  }

  // Verify quiz is published
  const quiz = await prisma.aiquiz.findUnique({ where: { aiquizid: quizId } });
  if (!quiz || quiz.status !== 'PUBLISHED' || !quiz.isactive) {
    sendError(res, 'Internal error', [], 404);
    return;
  }

  try {
    const attempt = await aiQuizCrud.startAttempt(quizId, student.studentid);
    sendSuccess(res, attempt, undefined, undefined, 201);
  } catch (error: any) {
    sendError(res, 'Internal error', [], 409);
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
    sendSuccess(res, result, undefined, undefined, 200);
  } catch (error: any) {
    sendError(res, 'Internal error', [], 400);
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
  sendSuccess(res, result, undefined, undefined, 200);
});

/**
 * GET /api/v1/ai-quiz/attempt/:attemptId
 * Get attempt details (for result page)
 */
export const getAttemptDetails = catchAsync(async (req: Request, res: Response) => {
  const attemptId = parseInt(req.params.attemptId as string, 10);
  const attempt = await aiQuizCrud.getAttemptById(attemptId);

  if (!attempt) {
    sendError(res, 'Internal error', [], 404);
    return;
  }

  sendSuccess(res, attempt, undefined, undefined, 200);
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
    sendError(res, 'Internal error', [], 400);
    return;
  }

  const grant = await aiQuizCrud.grantReattempt(quizId, Number(studentId), userId, reason);
  sendSuccess(res, grant, undefined, undefined, 201);
});

/**
 * POST /api/v1/ai-quiz/regenerate
 * Faculty: Regenerate a single AI question
 */
export const regenerateQuestion = catchAsync(async (req: Request, res: Response) => {
  const { topic, difficulty, questionType, oldQuestionText, pdfurl } = req.body;

  if (!topic || !difficulty || !questionType || !oldQuestionText) {
    sendError(res, 'Internal error', [], 400);
    return;
  }

  let pdfText = undefined;
  if (pdfurl) {
    try {
      const buffer = await storageService.readFile(pdfurl);
      if (pdfurl.endsWith('.pdf')) {
        const pdfData = await pdfParse(buffer);
        pdfText = pdfData.text;
      } else if (pdfurl.endsWith('.docx')) {
        const mammoth = require('mammoth');
        const docxData = await mammoth.extractRawText({ buffer: buffer });
        pdfText = docxData.value;
      }
    } catch (err) {
      console.warn('[AI Quiz] Regenerate failed to read context:', err);
    }
  }

  const question = await aiQuizService.regenerateQuestionWithAI(
    topic,
    difficulty,
    questionType,
    oldQuestionText,
    pdfText
  );

  sendSuccess(res, question, undefined, undefined, 200);
});
