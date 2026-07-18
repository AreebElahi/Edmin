import { Request, Response } from 'express';
import prisma from '../config/prisma.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess, sendError } from '../contracts/api.contracts.js';
import { bulkMarkAttendance } from '../services/attendance/attendance.service.js';
import { createAuditEntry } from '../services/workflows/shared/audit.service.js';
import { emitWorkflowNotification } from '../services/workflows/shared/notification.service.js';
import { attendance_status } from '@prisma/client';
import { redisConnection } from '../config/redis.js';

// 1. Get Student Attendance Summary
export const getStudentAttendance = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const cacheKey = `api:attendance:student:${userId}`;

  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  // Find student
  const student = await prisma.student.findFirst({
    where: { userid: userId }
  });

  if (!student) {
    return sendError(res, 'Student profile not found', 'NOT_FOUND', 404);
  }

  const summaries = await prisma.attendancesummary.findMany({
    where: { studentid: student.studentid, isactive: true },
    include: {
      courseoffering: {
        include: {
          course: true,
          semester: true,
          faculty: true
        }
      }
    }
  });

  const courses = summaries.map(s => {
    const totalClasses = s.totalclasses || 0;
    const presentCount = s.totalpresent || 0;
    const lateCount = s.totallate || 0;
    const points = presentCount + lateCount;
    const maxPoints = totalClasses;
    const percentage = maxPoints > 0 ? Number(((points / maxPoints) * 100).toFixed(1)) : null;

    return {
      id: s.courseofferingid.toString(),
      name: s.courseoffering.course.name,
      code: s.courseoffering.course.code,
      takenSessions: totalClasses,
      points,
      maxPoints,
      percentage
    };
  });

  const fullResponse = { success: true, data: { courses } };
  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.setex(cacheKey, 180, JSON.stringify(fullResponse));
  }

  return res.status(200).json(fullResponse);
});

// 2. Get Faculty Sessions
export const getFacultySessions = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const cacheKey = `api:attendance:faculty_sessions:${userId}`;

  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  // Find faculty
  const faculty = await prisma.faculty.findFirst({
    where: { userid: userId }
  });

  if (!faculty) {
    return sendError(res, 'Faculty profile not found', 'NOT_FOUND', 404);
  }

  // Also fetch all courses taught by this faculty member to build the course cards
  const offerings = await prisma.courseoffering.findMany({
    where: { instructorid: faculty.facultyid, isactive: true },
    include: {
      course: true,
      semester: true,
      courseenrollment: {
        where: { isactive: true }
      }
    }
  });

  const offeringIds = offerings.map(o => o.courseofferingid);

  // Find class sessions for these course offerings
  const sessions = await prisma.classsession.findMany({
    where: {
      courseofferingid: { in: offeringIds },
      isactive: true
    },
    include: {
      attendance: true
    },
    orderBy: {
      sessiondate: 'desc'
    }
  });

  const offeringMap = new Map(offerings.map(o => [o.courseofferingid, o]));

  const mappedSessions = sessions.map(s => {
    const offering = offeringMap.get(s.courseofferingid);
    return {
      classsessionid: s.classsessionid,
      courseName: offering?.course.name || 'Unknown Course',
      courseCode: offering?.course.code || 'Unknown Code',
      sessionDate: s.sessiondate,
      startTime: s.starttime,
      endTime: s.endtime,
      status: s.status,
      topic: s.topic,
      attendanceCount: s.attendance.length,
      totalStudents: offering?.courseenrollment.length || 0
    };
  });

  const mappedCourses = offerings.map((o, idx) => {
    const colors = ['blue', 'purple', 'teal', 'indigo', 'violet'];
    return {
      id: o.courseofferingid.toString(),
      name: o.course.name,
      code: o.course.code,
      students: o.courseenrollment.length,
      semester: o.semester.name,
      color: colors[idx % colors.length],
      progress: -1 // TODO(Phase10): Compute real progress
    };
  });

  const fullResponse = { success: true, data: { sessions: mappedSessions, courses: mappedCourses } };
  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.setex(cacheKey, 180, JSON.stringify(fullResponse));
  }

  return res.status(200).json(fullResponse);
});

// 3. Get Class Session Roster
export const getClassSessionRoster = catchAsync(async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const sId = parseInt(sessionId as string, 10);

  if (isNaN(sId)) {
    return sendError(res, 'Invalid session ID', 'BAD_REQUEST', 400);
  }

  const cacheKey = `api:attendance:session_roster:${sId}`;
  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  const session = await prisma.classsession.findUnique({
    where: { classsessionid: sId, isactive: true },
    include: {
      attendance: true
    }
  });

  if (!session) {
    return sendError(res, 'Class session not found', 'NOT_FOUND', 404);
  }

  const offering = await prisma.courseoffering.findUnique({
    where: { courseofferingid: session.courseofferingid },
    include: {
      course: true,
      courseenrollment: {
        where: { isactive: true },
        include: {
          student: {
            include: {
              user: true
            }
          }
        }
      }
    }
  });

  if (!offering) {
    return sendError(res, 'Course offering not found', 'NOT_FOUND', 404);
  }

  // Create a map of existing attendance status for students
  const attendanceMap = new Map(session.attendance.map(a => [a.studentid, a.status]));

  const roster = offering.courseenrollment.map(ce => {
    const dbStatus = attendanceMap.get(ce.studentid);
    // Map DB status enum to client lowercase status
    let clientStatus: 'present' | 'absent' | 'late' | 'pending' = 'pending';
    if (dbStatus === 'PRESENT') clientStatus = 'present';
    else if (dbStatus === 'ABSENT') clientStatus = 'absent';
    else if (dbStatus === 'LATE') clientStatus = 'late';

    return {
      id: ce.studentid.toString(),
      name: ce.student.fullname || ce.student.user.username,
      rollNo: ce.student.rollnumber || ce.studentid.toString(),
      status: clientStatus
    };
  });

  const fullResponse = { success: true, data: {
    courseName: offering.course.name,
    courseCode: offering.course.code,
    sessionDate: session.sessiondate,
    topic: session.topic,
    roster
  }};

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.setex(cacheKey, 180, JSON.stringify(fullResponse));
  }

  return res.status(200).json(fullResponse);
});

// 4. Bulk Mark Attendance
export const bulkMarkAttendanceHandler = catchAsync(async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const sId = parseInt(sessionId as string, 10);
  const { records } = req.body; // Array of { studentId: string, status: 'present' | 'absent' | 'late' }
  const actorUserId = req.user.userId;

  if (isNaN(sId)) {
    return sendError(res, 'Invalid session ID', 'BAD_REQUEST', 400);
  }

  if (!Array.isArray(records)) {
    return sendError(res, 'Records must be an array', 'BAD_REQUEST', 400);
  }

  // Map to service expectations
  const mappedRecords = records.map((r: any) => {
    let dbStatus: attendance_status = 'PRESENT';
    if (r.status === 'absent') dbStatus = 'ABSENT';
    else if (r.status === 'late') dbStatus = 'LATE';

    return {
      studentId: parseInt(r.studentId, 10),
      status: dbStatus
    };
  });

  const result = await bulkMarkAttendance(sId, mappedRecords);

  // Audit entry
  await createAuditEntry(actorUserId, 'MARK_ATTENDANCE', 'classsession', sId, { records });

  // Find class session details to include course name in notification
  const session = await prisma.classsession.findUnique({
    where: { classsessionid: sId }
  });

  if (session) {
    const offering = await prisma.courseoffering.findUnique({
      where: { courseofferingid: session.courseofferingid },
      include: { course: true }
    });

    // Notify students who were marked absent or late
    for (const r of mappedRecords) {
      if (r.status === 'ABSENT' || r.status === 'LATE') {
        const studentRecord = await prisma.student.findUnique({
          where: { studentid: r.studentId }
        });

        if (studentRecord) {
          await emitWorkflowNotification(
            studentRecord.userid,
            `Attendance: ${r.status}`,
            `You were marked ${r.status.toLowerCase()} in ${offering?.course.name || 'your class'} today.`,
            'ATTENDANCE',
            '/dashboard/student/attendance'
          );
        }
      }
    }
  }

  // Invalidate admin attendance-audit cache
  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del('api:admin:faculty:attendance-audit');
  }

  return sendSuccess(res, { message: 'Attendance marked successfully', result });
});
