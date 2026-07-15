import { Request, Response } from 'express';

import { getSignedUrl } from '../services/storage.service.js';

import prisma from '../config/prisma.js';

export const downloadSubmission = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assignmentId, submissionId } = req.params;
    const user = req.user; // from auth middleware

    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
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
      res.status(404).json({ success: false, message: 'Submission not found' });
      return;
    }

    if (!submission.fileUrl) {
      res.status(404).json({ success: false, message: 'No file associated with this submission' });
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
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    const signedUrl = await getSignedUrl(submission.fileUrl, 3600);

    res.status(200).json({
      success: true,
      data: {
        url: signedUrl,
        expiresIn: 3600
      }
    });
  } catch (error: any) {
    console.error('Download submission error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate download URL' });
  }
};

export const downloadQuizPdf = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const quiz = await prisma.aiquiz.findUnique({
      where: { aiquizid: parseInt(id as string, 10) }
    });

    if (!quiz) {
      res.status(404).json({ success: false, message: 'Quiz not found' });
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
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    if (!quiz.pdfurl) {
      res.status(404).json({ success: false, message: 'No PDF associated with this quiz' });
      return;
    }

    const signedUrl = await getSignedUrl(quiz.pdfurl, 3600);

    res.status(200).json({
      success: true,
      url: signedUrl,
      expiresIn: 3600
    });
  } catch (error: any) {
    console.error('Download quiz PDF error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate download URL' });
  }
};
