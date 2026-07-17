import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync.js';
import * as facultyCourseService from '../services/faculty/facultyCourse.service.js';
import * as facultyStudentService from '../services/faculty/facultyStudent.service.js';
import * as facultyAssessmentService from '../services/faculty/facultyAssessment.service.js';
import * as facultyHrService from '../services/faculty/facultyHr.service.js';

export const getCourses = catchAsync(async (req: Request, res: Response) => {
  const data = await facultyCourseService.getCourses(req.user.userId);
  res.status(200).json({ success: true, data });
});

export const getStudents = catchAsync(async (req: Request, res: Response) => {
  const data = await facultyStudentService.getStudents(req.user.userId);
  res.status(200).json({ success: true, data });
});

export const updateStudentGrade = catchAsync(async (req: Request, res: Response) => {
  const data = await facultyStudentService.updateStudentGrade(req.user.userId, req.params.enrollmentId as string, req.body.grade);
  res.status(200).json({ success: true, data });
});

export const createAssignment = catchAsync(async (req: Request, res: Response) => {
  const data = await facultyAssessmentService.createAssignment(req.user.userId, req.body.courseOfferingId, req.body.title, req.body.maxMarks, req.body.dueDate);
  res.status(201).json({ success: true, data });
});

export const updateAssignment = catchAsync(async (req: Request, res: Response) => {
  const data = await facultyAssessmentService.updateAssignment(req.user.userId, req.params.id as string, req.body.title, req.body.maxMarks, req.body.dueDate);
  res.status(200).json({ success: true, data });
});

export const getAssignments = catchAsync(async (req: Request, res: Response) => {
  const data = await facultyAssessmentService.getAssignments(req.user.userId);
  res.status(200).json({ success: true, data });
});

export const getQuizzes = catchAsync(async (req: Request, res: Response) => {
  const data = await facultyAssessmentService.getQuizzes(req.user.userId);
  res.status(200).json({ success: true, data });
});

export const deleteAssignment = catchAsync(async (req: Request, res: Response) => {
  const data = await facultyAssessmentService.deleteAssignment(req.user.userId, req.params.id as string);
  res.status(200).json({ success: true, data });
});

export const deleteQuiz = catchAsync(async (req: Request, res: Response) => {
  const data = await facultyAssessmentService.deleteQuiz(req.user.userId, req.params.id as string, req.query.isAi as string);
  res.status(200).json({ success: true, data });
});

export const createQuiz = catchAsync(async (req: Request, res: Response) => {
  const data = await facultyAssessmentService.createQuiz(req.user.userId, req.body.courseOfferingId, req.body.title, req.body.duration, req.body.totalMarks);
  res.status(201).json({ success: true, data });
});

export const grantReattempt = catchAsync(async (req: Request, res: Response) => {
  const data = await facultyAssessmentService.grantReattempt(req.user.userId, req.params.id as string, req.body.studentId, req.body.reason, req.body.isAi);
  res.status(200).json({ success: true, data });
});

export const getSchedule = catchAsync(async (req: Request, res: Response) => {
  const data = await facultyCourseService.getSchedule(req.user.userId);
  res.status(200).json({ success: true, data });
});

export const getAvailableTeachingCourses = catchAsync(async (req: Request, res: Response) => {
  const data = await facultyCourseService.getAvailableTeachingCourses();
  res.status(200).json({ success: true, data });
});

export const getAttendanceSessions = catchAsync(async (req: Request, res: Response) => {
  const data = await facultyStudentService.getAttendanceSessions(req.user.userId);
  res.status(200).json({ success: true, data });
});

export const getAttendanceSessionRoster = catchAsync(async (req: Request, res: Response) => {
  const data = await facultyStudentService.getAttendanceSessionRoster(req.user.userId, req.params.sessionId as string);
  res.status(200).json({ success: true, data });
});

export const markAttendance = catchAsync(async (req: Request, res: Response) => {
  const data = await facultyStudentService.markAttendance(req.user.userId, req.body.sessionId, req.body.records);
  res.status(200).json({ success: true, data });
});

export const getAnalytics = catchAsync(async (req: Request, res: Response) => {
  const data = await facultyHrService.getAnalytics(req.user.userId);
  res.status(200).json({ success: true, data });
});

export const getMyPendingApprovals = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  const data = await facultyCourseService.getMyPendingApprovals(req.user.userId, skip, limit);
  res.status(200).json({ success: true, data });
});

export const getHrSummary = catchAsync(async (req: Request, res: Response) => {
  const data = await facultyHrService.getHrSummary(req.user.userId);
  res.status(200).json({ success: true, data });
});

export const getPayslip = catchAsync(async (req: Request, res: Response) => {
  const data = await facultyHrService.getPayslip(req.user.userId, parseInt(req.params.id as string));
  res.status(200).json({ success: true, data });
});

export const createAttendanceSession = catchAsync(async (req: Request, res: Response) => {
  if (!req.body.courseOfferingId || !req.body.sessionDate) {
    return res.status(400).json({ success: false, error: 'courseOfferingId and sessionDate are required' });
  }
  const data = await facultyStudentService.createAttendanceSessionRecord(
    req.user.userId,
    req.body.courseOfferingId,
    req.body.sessionDate,
    req.body.startTime,
    req.body.endTime,
    req.body.topic
  );
  res.status(201).json({ success: true, data });
});
