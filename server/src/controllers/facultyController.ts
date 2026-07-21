import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync.js';
import * as facultyCourseService from '../services/faculty/facultyCourse.service.js';
import * as facultyStudentService from '../services/faculty/facultyStudent.service.js';
import * as facultyAssessmentService from '../services/faculty/facultyAssessment.service.js';
import * as facultyHrService from '../services/faculty/facultyHr.service.js';
import { redisConnection } from '../config/redis.js';

export const getCourses = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const cacheKey = `api:faculty:courses:${userId}`;

  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  const data = await facultyCourseService.getCourses(userId);
  const fullResponse = { success: true, data };

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.setex(cacheKey, 900, JSON.stringify(fullResponse)); // cache for 15 mins
  }

  res.status(200).json(fullResponse);
});

export const getStudents = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const cacheKey = `api:faculty:students:${userId}`;

  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  const data = await facultyStudentService.getStudents(userId);
  const fullResponse = { success: true, data };

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.setex(cacheKey, 900, JSON.stringify(fullResponse));
  }

  res.status(200).json(fullResponse);
});

export const updateStudentGrade = catchAsync(async (req: Request, res: Response) => {
  const data = await facultyStudentService.updateStudentGrade(req.user.userId, req.params.enrollmentId as string, req.body.grade);
  res.status(200).json({ success: true, data });
});

export const createAssignment = catchAsync(async (req: Request, res: Response) => {
  const data = await facultyAssessmentService.createAssignment(req.user.userId, req.body.courseOfferingId, req.body.title, req.body.maxMarks, req.body.dueDate);
  
  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del(`api:faculty:assignments:v2:${req.user.userId}`);
  }
  
  res.status(201).json({ success: true, data });
});

export const updateAssignment = catchAsync(async (req: Request, res: Response) => {
  const data = await facultyAssessmentService.updateAssignment(req.user.userId, req.params.id as string, req.body.title, req.body.maxMarks, req.body.dueDate);

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del(`api:faculty:assignments:v2:${req.user.userId}`);
  }

  res.status(200).json({ success: true, data });
});

export const getAssignments = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const cacheKey = `api:faculty:assignments:v2:${userId}`;

  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  const data = await facultyAssessmentService.getAssignments(userId);
  const fullResponse = { success: true, data };

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.setex(cacheKey, 900, JSON.stringify(fullResponse));
  }

  res.status(200).json(fullResponse);
});

export const getQuizzes = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const cacheKey = `api:faculty:quizzes:${userId}`;

  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  const data = await facultyAssessmentService.getQuizzes(userId);
  const fullResponse = { success: true, data };

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.setex(cacheKey, 900, JSON.stringify(fullResponse));
  }

  res.status(200).json(fullResponse);
});

export const deleteAssignment = catchAsync(async (req: Request, res: Response) => {
  const data = await facultyAssessmentService.deleteAssignment(req.user.userId, req.params.id as string);

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del(`api:faculty:assignments:v2:${req.user.userId}`);
  }

  res.status(200).json({ success: true, data });
});

export const deleteQuiz = catchAsync(async (req: Request, res: Response) => {
  const data = await facultyAssessmentService.deleteQuiz(req.user.userId, req.params.id as string, req.query.isAi as string);

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del(`api:faculty:quizzes:${req.user.userId}`);
  }

  res.status(200).json({ success: true, data });
});

export const createQuiz = catchAsync(async (req: Request, res: Response) => {
  const data = await facultyAssessmentService.createQuiz(req.user.userId, req.body.courseOfferingId, req.body.title, req.body.duration, req.body.totalMarks);

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del(`api:faculty:quizzes:${req.user.userId}`);
  }

  res.status(201).json({ success: true, data });
});

export const getQuizDetails = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const quizId = req.params.id as string;
  const cacheKey = `api:faculty:quiz:${userId}:${quizId}`;

  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.status(200).json({ success: true, data: JSON.parse(cached), cached: true });
      return;
    }
  }

  const data = await facultyAssessmentService.getQuizDetails(userId, quizId);

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.setex(cacheKey, 300, JSON.stringify(data)); // 5 mins TTL
  }

  res.status(200).json({ success: true, data });
});

export const grantReattempt = catchAsync(async (req: Request, res: Response) => {
  const data = await facultyAssessmentService.grantReattempt(req.user.userId, req.params.id as string, req.body.studentId, req.body.reason, req.body.isAi);
  res.status(200).json({ success: true, data });
});

export const getSchedule = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const cacheKey = `api:faculty:schedule:${userId}`;

  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  const data = await facultyCourseService.getSchedule(userId);
  const fullResponse = { success: true, data };

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.setex(cacheKey, 900, JSON.stringify(fullResponse));
  }

  res.status(200).json(fullResponse);
});

export const getAvailableTeachingCourses = catchAsync(async (req: Request, res: Response) => {
  const data = await facultyCourseService.getAvailableTeachingCourses(req.user.userId);
  res.status(200).json({ success: true, data });
});

export const submitTeachingLoad = catchAsync(async (req: Request, res: Response) => {
  const { semesterId, courseOfferingIds } = req.body;
  const data = await facultyCourseService.submitTeachingLoad(req.user.userId, semesterId, courseOfferingIds);
  res.status(200).json({ success: true, data });
});

export const getAttendanceSessions = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const cacheKey = `api:faculty:attendance-sessions:${userId}`;

  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  const data = await facultyStudentService.getAttendanceSessions(userId);
  const fullResponse = { success: true, data };

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.setex(cacheKey, 900, JSON.stringify(fullResponse));
  }

  res.status(200).json(fullResponse);
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
  const userId = req.user.userId;
  const cacheKey = `api:faculty:pending-approvals:${userId}:${page}:${limit}`;

  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  const data = await facultyCourseService.getMyPendingApprovals(userId, skip, limit);
  const fullResponse = { success: true, data };

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.setex(cacheKey, 900, JSON.stringify(fullResponse)); // cache for 15 mins
  }

  res.status(200).json(fullResponse);
});

export const getHrSummary = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const cacheKey = `api:faculty:hr-summary:${userId}`;

  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  const data = await facultyHrService.getHrSummary(userId);
  const fullResponse = { success: true, data };

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.setex(cacheKey, 900, JSON.stringify(fullResponse)); // cache for 15 mins
  }

  res.status(200).json(fullResponse);
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

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del(`api:faculty:attendance-sessions:${req.user.userId}`);
    await redisConnection.del(`api:faculty:course-details:${req.user.userId}:${req.body.courseOfferingId}`);
  }

  res.status(201).json({ success: true, data });
});

export const getCourseDetails = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const courseId = req.params.id as string;
  const cacheKey = `api:faculty:course-details:${userId}:${courseId}`;

  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.status(200).json({ success: true, data: JSON.parse(cached), cached: true });
      return;
    }
  }

  const data = await facultyCourseService.getCourseDetails(userId, courseId);

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.setex(cacheKey, 300, JSON.stringify(data)); // 5 mins TTL
  }

  res.status(200).json({ success: true, data });
});

export const getAssignmentSubmissions = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const assignmentId = parseInt(req.params.assignmentId as string, 10);
  const cacheKey = `api:faculty:assignments:submissions:${userId}:${assignmentId}`;

  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  const data = await facultyAssessmentService.getAssignmentSubmissions(userId, assignmentId);
  const fullResponse = { success: true, data };

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.setex(cacheKey, 300, JSON.stringify(fullResponse)); // cache for 5 mins
  }

  res.status(200).json(fullResponse);
});

export const gradeAssignmentSubmission = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const assignmentId = parseInt(req.params.assignmentId as string, 10);
  const studentId = parseInt(req.params.studentId as string, 10);
  const { obtainedMarks, remarks } = req.body;
  const data = await facultyAssessmentService.gradeAssignmentSubmission(userId, assignmentId, studentId, obtainedMarks, remarks);

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del(`api:faculty:assignments:submissions:${userId}:${assignmentId}`);
    await redisConnection.del(`api:faculty:assignments:v2:${userId}`);
  }

  res.status(200).json({ success: true, data });
});
