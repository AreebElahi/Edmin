import { Request, Response } from 'express';

import { getSignedUrl } from '../services/storage.service.js';

import prisma from '../config/prisma.js';
import { sendSuccess, sendError } from "../contracts/api.contracts.js";
import { getCachedResponse, setCachedResponse } from "../config/redis.js";

export const downloadSubmission = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assignmentId, submissionId } = req.params;
    const user = req.user; // from auth middleware

    if (!user) {
      sendError(res, 'Unauthorized', [], 401);
      return;
    }

    const submission = await prisma.assignmentsubmission.findUnique({
      where: { assignmentsubmissionid: parseInt(submissionId as string, 10) },
      include: {
        assignment: {
          include: {
            courseoffering: {
              include: {
                teachingassignment: {
                  include: { teachingload: true }
                }
              }
            }
          }
        }
      }
    });

    if (!submission || submission.assignmentid !== parseInt(assignmentId as string, 10)) {
      sendError(res, 'Submission not found', [], 404);
      return;
    }

    if (!submission.fileUrl) {
      sendError(res, 'No file associated with this submission', [], 404);
      return;
    }

    // RBAC check
    let authorized = false;
    
    // Admins can download anything
    if (user.roles?.includes('ADMIN') || user.role === 'ADMIN') {
      authorized = true;
    } 
    // Students can only download their own submission
    else if (user.roles?.includes('STUDENT') || user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userid: user.userId } });
      if (student && submission.studentid === student.studentid) {
        authorized = true;
      }
    } 
    // Faculty can download submissions for their courses
    else if (user.roles?.includes('FACULTY') || user.role === 'FACULTY') {
      const faculty = await prisma.faculty.findUnique({ where: { userid: user.userId } });
      if (faculty) {
        const offering = submission.assignment.courseoffering;
        const isTeachingCourse = 
          offering?.instructorid === faculty.facultyid || 
          offering?.teachingassignment.some(ta => ta.teachingload?.facultyid === faculty.facultyid);
        
        if (isTeachingCourse) {
          authorized = true;
        }
      }
    }

    if (!authorized) {
      sendError(res, 'Forbidden', [], 403);
      return;
    }

    const signedUrl = await getSignedUrl(submission.fileUrl, 3600);

    sendSuccess(res, {
              url: signedUrl,
              expiresIn: 3600
            }, undefined, undefined, 200);
  } catch (error: any) {
    console.error('Download submission error:', error);
    sendError(res, 'Failed to generate download URL', [], 500);
  }
};

export const downloadQuizPdf = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      sendError(res, 'Unauthorized', [], 401);
      return;
    }

    const quiz = await prisma.aiquiz.findUnique({
      where: { aiquizid: parseInt(id as string, 10) }
    });

    if (!quiz) {
      sendError(res, 'Quiz not found', [], 404);
      return;
    }

    let authorized = false;
    
    console.log("storage.controller.ts - user:", user);
    // Admins can download anything
    if (user.roles?.includes('ADMIN') || user.role === 'ADMIN') {
      authorized = true;
    } 
    // Faculty can download ONLY if they own the quiz
    else if (user.roles?.includes('FACULTY') || user.role === 'FACULTY') {
      const faculty = await prisma.faculty.findUnique({ where: { userid: user.userId } });
      console.log("storage.controller.ts - faculty:", faculty, "quiz.facultyid:", quiz.facultyid);
      if (faculty && quiz.facultyid === faculty.facultyid) {
        authorized = true;
      }
    }

    if (!authorized) {
      console.log("storage.controller.ts - not authorized!");
      sendError(res, 'Forbidden', [], 403);
      return;
    }

    if (!quiz.pdfurl) {
      sendError(res, 'No PDF associated with this quiz', [], 404);
      return;
    }

    const signedUrl = await getSignedUrl(quiz.pdfurl, 3600);

    sendSuccess(res, {
            success: true,
            url: signedUrl,
            expiresIn: 3600
          }, undefined, undefined, 200);
  } catch (error: any) {
    console.error('Download quiz PDF error:', error);
    sendError(res, 'Failed to generate download URL', [], 500);
  }
};
