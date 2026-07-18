import { Request, Response } from 'express';
import { sendSuccess, sendError, ApiResponse } from '../../contracts/api.contracts.js';
import prisma from '../../config/prisma.js';
import { createAuditEntry } from '../../services/workflows/shared/audit.service.js';
import { approveTeachingLoad, rejectTeachingLoad } from '../../services/workflows/teachingLoadWorkflow.service.js';
import { approveLeaveRequest, rejectLeaveRequest, archiveLeaveRequest } from '../../services/workflows/leaveWorkflow.service.js';
import { approveActivityReport, rejectActivityReport, archiveActivityReport } from '../../services/workflows/activityReportWorkflow.service.js';
import fs from 'fs';
import path from 'path';
import { redisConnection, acquireLock, releaseLock } from '../../config/redis.js';

const invalidateTeachingLoadsCache = async () => {
  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del('api:admin:faculty:teaching-loads');
  }
};

const invalidateActivityReportsCache = async () => {
  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del('api:admin:faculty:activity-reports');
  }
};

const invalidateAttendanceAuditCache = async () => {
  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del('api:admin:faculty:attendance-audit');
  }
};

const invalidateWorkloadAnalyticsCache = async () => {
  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del('api:admin:faculty:workload-analytics');
  }
};

// Helper to read configuration
const getSystemConfig = () => {
  try {
    const configPath = path.resolve(process.cwd(), 'src/config/systemConfig.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (err) {
    console.error('Failed to read config file:', err);
  }
  return { minimumTeachingCredits: 12, maximumTeachingCredits: 18 };
};

// 1. Faculty Directory
export const getFacultyDirectory = async (req: Request, res: Response<ApiResponse>) => {
  try {
    let version = '0';
    if (redisConnection && redisConnection.status === 'ready') {
      version = await redisConnection.get('api:admin:users:version') || '0';
    }
    const cacheKey = `api:admin:faculty:directory:v${version}`;

    if (redisConnection && redisConnection.status === 'ready') {
      const cached = await redisConnection.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(cached);
      }
    }

    let isLeader = false;
    if (redisConnection && redisConnection.status === 'ready') {
      isLeader = await acquireLock(cacheKey, 5);
    } else {
      isLeader = true;
    }

    if (isLeader) {
      try {
        const faculties = await prisma.faculty.findMany({
          include: {
            user: true,
            department: {
              include: {
                user: {
                  include: { faculty: true }
                },
                supervisor: {
                  include: { faculty: true }
                }
              }
            },
            courseoffering: {
              include: {
                course: true
              }
            }
          }
        });

        const data = faculties.map(fac => {
          const hodName = fac.department?.user?.faculty?.fullname || fac.department?.user?.username || 'N/A';
          const supervisorName = fac.department?.supervisor?.faculty?.fullname || fac.department?.supervisor?.username || 'N/A';

          return {
            facultyid: fac.facultyid,
            employeenumber: fac.employeenumber || 'N/A',
            fullname: fac.fullname || fac.user.username,
            email: fac.user.email,
            institutionalEmail: fac.user.institutionalEmail || 'N/A',
            role: fac.user.role,
            accountStatus: fac.user.accountStatus,
            department: fac.department?.name || 'N/A',
            departmentCode: fac.department?.code || 'N/A',
            hodName,
            supervisorName,
            assignedCourses: fac.courseoffering.map(co => ({
              courseofferingid: co.courseofferingid,
              code: co.course.code,
              name: co.course.name,
              credits: co.course.credits
            })),
            isactive: fac.isactive
          };
        });

        const fullResponse = { success: true, data };

        if (redisConnection && redisConnection.status === 'ready') {
          await redisConnection.setex(cacheKey, 300, JSON.stringify(fullResponse));
          await releaseLock(cacheKey);
        }

        return res.status(200).json(fullResponse);
      } catch (error) {
        if (redisConnection && redisConnection.status === 'ready') {
          await releaseLock(cacheKey);
        }
        throw error;
      }
    } else {
      for (let attempt = 0; attempt < 10; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const cached = await redisConnection!.get(cacheKey);
        if (cached) {
          res.setHeader('Content-Type', 'application/json');
          return res.status(200).send(cached);
        }
      }
      return res.status(200).json({ success: true, data: [] });
    }
  } catch (error: any) {
    console.error('getFacultyDirectory Error:', error);
    return sendError(res, error.message || 'Failed to fetch faculty directory');
  }
};

// 2. Teaching Loads List
export const getTeachingLoads = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const cacheKey = 'api:admin:faculty:teaching-loads';

    if (redisConnection && redisConnection.status === 'ready') {
      const cached = await redisConnection.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(cached);
      }
    }

    let isLeader = false;
    if (redisConnection && redisConnection.status === 'ready') {
      isLeader = await acquireLock(cacheKey, 5);
    } else {
      isLeader = true;
    }

    if (isLeader) {
      try {
        const teachingLoads = await prisma.teachingload.findMany({
          include: {
            faculty: {
              include: {
                user: true,
                department: true
              }
            },
            semester: true,
            teachingassignment: {
              include: {
                courseoffering: {
                  include: {
                    course: true
                  }
                }
              }
            },
            teachingloadapproval: {
              include: {
                user: {
                  include: { faculty: true }
                }
              }
            }
          },
          orderBy: {
            createdat: 'desc'
          }
        });

        const data = teachingLoads.map(tl => {
          const courses = tl.teachingassignment.map(ta => ({
            courseofferingid: ta.courseofferingid,
            code: ta.courseoffering.course.code,
            name: ta.courseoffering.course.name,
            credits: ta.courseoffering.course.credits
          }));

          const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);

          return {
            teachingloadid: tl.teachingloadid,
            facultyName: tl.faculty.fullname || tl.faculty.user.username,
            department: tl.faculty.department?.name || 'N/A',
            semester: tl.semester.name,
            status: tl.status,
            courses,
            totalCredits,
            createdat: tl.createdat,
            approvals: tl.teachingloadapproval.map(app => ({
              approver: app.user?.faculty?.fullname || app.user?.username || 'N/A',
              action: app.action,
              createdat: app.createdat
            }))
          };
        });

        const fullResponse = { success: true, data };

        if (redisConnection && redisConnection.status === 'ready') {
          await redisConnection.setex(cacheKey, 30, JSON.stringify(fullResponse));
          await releaseLock(cacheKey);
        }

        return res.status(200).json(fullResponse);
      } catch (error) {
        if (redisConnection && redisConnection.status === 'ready') {
          await releaseLock(cacheKey);
        }
        throw error;
      }
    } else {
      for (let attempt = 0; attempt < 10; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const cached = await redisConnection!.get(cacheKey);
        if (cached) {
          res.setHeader('Content-Type', 'application/json');
          return res.status(200).send(cached);
        }
      }
      return res.status(200).json({ success: true, data: [] });
    }
  } catch (error: any) {
    console.error('getTeachingLoads Error:', error);
    return sendError(res, error.message || 'Failed to fetch teaching loads');
  }
};

// 3. Override Teaching Load Approval
export const overrideTeachingLoad = async (req: Request, res: Response<ApiResponse>) => {
  const { id } = req.params;
  const { action, comment } = req.body;
  const teachingLoadId = parseInt(id as string, 10);
  const adminUserId = (req as any).user.userId;

  if (action !== 'APPROVE' && action !== 'REJECT') {
    return sendError(res, 'Action must be APPROVE or REJECT', 'INVALID_INPUT', 400);
  }

  try {
    let updated;
    if (action === 'APPROVE') {
      updated = await approveTeachingLoad(teachingLoadId, adminUserId, 'ADMIN', comment || 'Approved by Admin Override');
    } else {
      updated = await rejectTeachingLoad(teachingLoadId, adminUserId, 'ADMIN', comment || 'Rejected by Admin Override');
    }

    // Resolve open escalations
    await prisma.escalation.updateMany({
      where: { relatedid: teachingLoadId, relatedtype: 'TEACHING_LOAD', status: 'OPEN' },
      data: { status: 'RESOLVED' }
    });

    // Invalidate escalations list cache
    if (redisConnection && redisConnection.status === 'ready') {
      await redisConnection.del(`api:admin:escalations:${adminUserId}`);
    }
    await invalidateTeachingLoadsCache();
    await invalidateWorkloadAnalyticsCache();

    return sendSuccess(res, { message: `Teaching load override successful: ${action}`, updated });
  } catch (error: any) {
    console.error('overrideTeachingLoad Error:', error);
    return sendError(res, error.message || 'Failed to override teaching load');
  }
};

// 4. Reassign Course in Teaching Load
export const reassignTeachingLoadCourse = async (req: Request, res: Response<ApiResponse>) => {
  const { id } = req.params;
  const { courseOfferingIds } = req.body; // Array of courseofferingid numbers
  const teachingLoadId = parseInt(id as string, 10);
  const adminUserId = (req as any).user.userId;

  if (!Array.isArray(courseOfferingIds)) {
    return sendError(res, 'courseOfferingIds must be an array', 'INVALID_INPUT', 400);
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const tl = await tx.teachingload.findUnique({
        where: { teachingloadid: teachingLoadId }
      });
      if (!tl) throw new Error('Teaching load not found');

      // Delete current assignments
      await tx.teachingassignment.deleteMany({
        where: { teachingloadid: teachingLoadId }
      });

      // Create new assignments
      const assignments = await Promise.all(
        courseOfferingIds.map(coId =>
          tx.teachingassignment.create({
            data: {
              teachingloadid: teachingLoadId,
              courseofferingid: coId
            }
          })
        )
      );

      // Audit Log
      await createAuditEntry(adminUserId, 'REASSIGN_COURSES', 'teachingload', teachingLoadId, {
        reassignedToOfferings: courseOfferingIds
      });

      return assignments;
    });

    await invalidateTeachingLoadsCache();
    await invalidateWorkloadAnalyticsCache();

    return sendSuccess(res, { message: 'Teaching load courses reassigned successfully', updated });
  } catch (error: any) {
    console.error('reassignTeachingLoadCourse Error:', error);
    return sendError(res, error.message || 'Failed to reassign courses');
  }
};

// 5. Escalate Overdue Teaching Load Request
export const escalateTeachingLoad = async (req: Request, res: Response<ApiResponse>) => {
  const { id } = req.params;
  const teachingLoadId = parseInt(id as string, 10);
  const adminUserId = (req as any).user.userId;

  try {
    const tl = await prisma.teachingload.findUnique({
      where: { teachingloadid: teachingLoadId },
      include: { faculty: true }
    });

    if (!tl) {
      return sendError(res, 'Teaching load not found', 'NOT_FOUND', 404);
    }

    // Check if already escalated
    const existing = await prisma.escalation.findFirst({
      where: { relatedid: teachingLoadId, relatedtype: 'TEACHING_LOAD', status: 'OPEN' }
    });

    if (existing) {
      return sendError(res, 'Request is already escalated', 'DUPLICATE', 400);
    }

    const escalation = await prisma.escalation.create({
      data: {
        initiatedbyid: adminUserId,
        relatedid: teachingLoadId,
        relatedtype: 'TEACHING_LOAD',
        status: 'OPEN',
        target: 'ADMIN_OVERRIDE',
        userid: tl.faculty.userid
      }
    });

    // Audit Log
    await createAuditEntry(adminUserId, 'FORCE_ESCALATE', 'teachingload', teachingLoadId, {
      escalationId: escalation.escalationid
    });

    // Invalidate escalations list cache
    if (redisConnection && redisConnection.status === 'ready') {
      await redisConnection.del(`api:admin:escalations:${adminUserId}`);
    }
    await invalidateTeachingLoadsCache();
    await invalidateWorkloadAnalyticsCache();

    return sendSuccess(res, { message: 'Overdue teaching load escalated successfully', escalation });
  } catch (error: any) {
    console.error('escalateTeachingLoad Error:', error);
    return sendError(res, error.message || 'Failed to escalate teaching load');
  }
};

// 6. Leaves Oversight
export const getLeaves = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const leaves = await prisma.leaverequest.findMany({
      include: {
        user: {
          include: {
            faculty: {
              include: {
                department: true
              }
            }
          }
        },
        leavecomment: {
          include: {
            user: {
              include: {
                faculty: true
              }
            }
          }
        }
      },
      orderBy: {
        createdat: 'desc'
      }
    });

    const data = leaves.map(l => {
      const faculty = l.user.faculty;
      const comments = l.leavecomment.map(c => ({
        commenter: c.user?.faculty?.fullname || c.user?.username || 'N/A',
        comment: c.comment,
        createdat: c.createdat
      }));

      return {
        leaverequestid: l.leaverequestid,
        facultyName: faculty?.fullname || l.user.username,
        employeenumber: faculty?.employeenumber || 'N/A',
        department: faculty?.department?.name || 'N/A',
        leavetype: l.leavetype,
        startdate: l.startdate,
        enddate: l.enddate,
        status: l.status,
        createdat: l.createdat,
        comments
      };
    });

    return sendSuccess(res, data);
  } catch (error: any) {
    console.error('getLeaves Error:', error);
    return sendError(res, error.message || 'Failed to fetch leaves list');
  }
};

// 7. Override Leave Request
export const overrideLeave = async (req: Request, res: Response<ApiResponse>) => {
  const { id } = req.params;
  const { action, comment } = req.body; // action: 'APPROVE' | 'REJECT' | 'ARCHIVE'
  const leaveRequestId = parseInt(id as string, 10);
  const adminUserId = (req as any).user.userId;

  if (action !== 'APPROVE' && action !== 'REJECT' && action !== 'ARCHIVE') {
    return sendError(res, 'Action must be APPROVE, REJECT, or ARCHIVE', 'INVALID_INPUT', 400);
  }

  try {
    let updated;
    if (action === 'APPROVE') {
      updated = await approveLeaveRequest(leaveRequestId, adminUserId, comment || 'Approved by Admin Override');
    } else if (action === 'REJECT') {
      updated = await rejectLeaveRequest(leaveRequestId, adminUserId, comment || 'Rejected by Admin Override');
    } else {
      updated = await archiveLeaveRequest(leaveRequestId, adminUserId, comment || 'Archived by Admin Override');
    }

    // Clear open escalations
    await prisma.escalation.updateMany({
      where: { relatedid: leaveRequestId, relatedtype: 'LEAVE', status: 'OPEN' },
      data: { status: 'RESOLVED' }
    });

    // Invalidate escalations list cache and workload analytics
    if (redisConnection && redisConnection.status === 'ready') {
      await redisConnection.del(`api:admin:escalations:${adminUserId}`);
    }
    await invalidateWorkloadAnalyticsCache();

    return sendSuccess(res, { message: `Leave request status successfully overridden to ${action}`, updated });
  } catch (error: any) {
    console.error('overrideLeave Error:', error);
    return sendError(res, error.message || 'Failed to override leave request');
  }
};

// 8. Daily Activity Monitoring
export const getActivityReports = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const cacheKey = 'api:admin:faculty:activity-reports';

    if (redisConnection && redisConnection.status === 'ready') {
      const cached = await redisConnection.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(cached);
      }
    }

    let isLeader = false;
    if (redisConnection && redisConnection.status === 'ready') {
      isLeader = await acquireLock(cacheKey, 5);
    } else {
      isLeader = true;
    }

    if (isLeader) {
      try {
        // Run database calls in parallel to eliminate sequential delay
        const [reports, totalFacultyCount, escalatedReportsCount] = await Promise.all([
          prisma.dailyactivityreport.findMany({
            include: {
              faculty: {
                include: {
                  user: true
                }
              },
              department: true,
              dailyreportactivity: true
            },
            orderBy: {
              reportdate: 'desc'
            }
          }),
          prisma.faculty.count(),
          prisma.escalation.count({
            where: { relatedtype: 'REPORT', status: 'OPEN' }
          })
        ]);

        // Compute Metrics
        const todayStr = new Date().toISOString().split('T')[0];
        const reportsToday = reports.filter(r => r.reportdate.toISOString().split('T')[0] === todayStr).length;
        const missingTodayCount = Math.max(0, totalFacultyCount - reportsToday);
        const departmentCompliance = totalFacultyCount > 0 ? Number(((reportsToday / totalFacultyCount) * 100).toFixed(1)) : 100;

        // Check late submissions (createdat is a day or more after reportdate)
        const lateSubmissions = reports.filter(r => {
          const cDate = new Date(r.createdat).setHours(0,0,0,0);
          const rDate = new Date(r.reportdate).setHours(0,0,0,0);
          return cDate > rDate;
        }).length;

        const data = reports.map(r => ({
          dailyactivityreportid: r.dailyactivityreportid,
          facultyName: r.faculty.fullname || r.faculty.user.username,
          department: r.department.name,
          reportdate: r.reportdate,
          summary: r.summary,
          status: r.status,
          createdat: r.createdat,
          activities: r.dailyreportactivity.map(a => ({
            title: a.title || 'Activity',
            detail: a.detail || 'N/A'
          }))
        }));

        const fullResponse = {
          success: true,
          data: {
            metrics: {
              reportsSubmittedToday: reportsToday,
              missingReportsToday: missingTodayCount,
              complianceRatePercentage: departmentCompliance,
              lateSubmissionsCount: lateSubmissions,
              escalatedReportsCount
            },
            reports: data
          }
        };

        if (redisConnection && redisConnection.status === 'ready') {
          await redisConnection.setex(cacheKey, 30, JSON.stringify(fullResponse));
          await releaseLock(cacheKey);
        }

        return res.status(200).json(fullResponse);
      } catch (error) {
        if (redisConnection && redisConnection.status === 'ready') {
          await releaseLock(cacheKey);
        }
        throw error;
      }
    } else {
      for (let attempt = 0; attempt < 10; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const cached = await redisConnection!.get(cacheKey);
        if (cached) {
          res.setHeader('Content-Type', 'application/json');
          return res.status(200).send(cached);
        }
      }
      return res.status(200).json({ success: true, data: { metrics: {}, reports: [] } });
    }
  } catch (error: any) {
    console.error('getActivityReports Error:', error);
    return sendError(res, error.message || 'Failed to fetch daily activity reports');
  }
};

// 9. Override Daily Activity Report Status
export const overrideActivityReport = async (req: Request, res: Response<ApiResponse>) => {
  const { id } = req.params;
  const { status, comment } = req.body; // status: 'APPROVED' | 'REJECTED' | 'ARCHIVED'
  const reportId = parseInt(id as string, 10);
  const adminUserId = (req as any).user.userId;

  if (status !== 'APPROVED' && status !== 'REJECTED' && status !== 'ARCHIVED') {
    return sendError(res, 'Status must be APPROVED, REJECTED, or ARCHIVED', 'INVALID_INPUT', 400);
  }

  try {
    let updated;
    if (status === 'APPROVED') {
      updated = await approveActivityReport(reportId, adminUserId, 'ADMIN', comment || 'Approved by Admin Override');
    } else if (status === 'REJECTED') {
      updated = await rejectActivityReport(reportId, adminUserId, 'ADMIN', comment || 'Rejected by Admin Override');
    } else {
      updated = await archiveActivityReport(reportId, adminUserId, comment || 'Archived by Admin Override');
    }

    // Clear open escalations
    await prisma.escalation.updateMany({
      where: { relatedid: reportId, relatedtype: 'REPORT', status: 'OPEN' },
      data: { status: 'RESOLVED' }
    });

    // Invalidate escalations list cache, activity reports, and workload analytics
    if (redisConnection && redisConnection.status === 'ready') {
      await redisConnection.del(`api:admin:escalations:${adminUserId}`);
    }
    await invalidateActivityReportsCache();
    await invalidateWorkloadAnalyticsCache();

    return sendSuccess(res, { message: 'Activity report status updated successfully via override', updated });
  } catch (error: any) {
    console.error('overrideActivityReport Error:', error);
    return sendError(res, error.message || 'Failed to override daily activity report');
  }
};

export const getAttendanceAudit = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const cacheKey = 'api:admin:faculty:attendance-audit';

    if (redisConnection && redisConnection.status === 'ready') {
      const cached = await redisConnection.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(cached);
      }
    }

    let isLeader = false;
    if (redisConnection && redisConnection.status === 'ready') {
      isLeader = await acquireLock(cacheKey, 5);
    } else {
      isLeader = true;
    }

    if (isLeader) {
      try {
        // Execute all 3 Prisma fetches concurrently
        const [offerings, sessions, auditLogs] = await Promise.all([
          prisma.courseoffering.findMany({
            include: {
              course: true,
              faculty: true
            }
          }),
          prisma.classsession.findMany({
            include: {
              attendance: true
            },
            orderBy: {
              sessiondate: 'desc'
            },
            take: 100
          }),
          prisma.attendanceauditlog.findMany({
            include: {
              user: {
                include: {
                  faculty: true
                }
              },
              attendance: {
                include: {
                  classsession: true,
                  student: true
                }
              }
            },
            orderBy: {
              createdat: 'desc'
            },
            take: 100
          })
        ]);

        const offeringsMap = new Map(offerings.map(o => [o.courseofferingid, o]));

        const sessionsCreated = sessions.map(s => {
          const offering = offeringsMap.get(s.courseofferingid);
          return {
            classsessionid: s.classsessionid,
            date: s.sessiondate,
            topic: s.topic || 'N/A',
            courseName: offering?.course?.name || 'N/A',
            courseCode: offering?.course?.code || 'N/A',
            facultyName: offering?.faculty?.fullname || 'N/A',
            status: s.status,
            attendanceCount: s.attendance.length
          };
        });

        const missingSessions = sessionsCreated.filter(s => s.attendanceCount === 0 && new Date(s.date) < new Date());

        const editedSessions = auditLogs.map(log => {
          const offeringId = log.attendance?.classsession?.courseofferingid;
          const offering = offeringId ? offeringsMap.get(offeringId) : null;
          return {
            auditLogId: log.attendanceauditlogid,
            timestamp: log.createdat,
            editorName: log.user?.faculty?.fullname || log.user?.username || 'System',
            studentName: log.attendance?.student?.fullname || 'Student',
            oldStatus: log.oldstatus || 'N/A',
            newStatus: log.newstatus || 'N/A',
            courseName: offering?.course?.name || 'N/A',
            sessionDate: log.attendance?.classsession?.sessiondate || 'N/A'
          };
        });

        const data = {
          sessionsCreated,
          missingSessions,
          editedSessions,
          auditLogs: editedSessions
        };

        const fullResponse = { success: true, data };

        if (redisConnection && redisConnection.status === 'ready') {
          await redisConnection.setex(cacheKey, 30, JSON.stringify(fullResponse));
          await releaseLock(cacheKey);
        }

        return res.status(200).json(fullResponse);
      } catch (error) {
        if (redisConnection && redisConnection.status === 'ready') {
          await releaseLock(cacheKey);
        }
        throw error;
      }
    } else {
      for (let attempt = 0; attempt < 10; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const cached = await redisConnection!.get(cacheKey);
        if (cached) {
          res.setHeader('Content-Type', 'application/json');
          return res.status(200).send(cached);
        }
      }
      return res.status(200).json({ success: true, data: { sessionsCreated: [], missingSessions: [], editedSessions: [], auditLogs: [] } });
    }
  } catch (error: any) {
    console.error('getAttendanceAudit Error:', error);
    return sendError(res, error.message || 'Failed to fetch attendance audit details');
  }
};

// 11. Workload Analytics
export const getWorkloadAnalytics = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const cacheKey = 'api:admin:faculty:workload-analytics';

    if (redisConnection && redisConnection.status === 'ready') {
      const cached = await redisConnection.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(cached);
      }
    }

    let isLeader = false;
    if (redisConnection && redisConnection.status === 'ready') {
      isLeader = await acquireLock(cacheKey, 5);
    } else {
      isLeader = true;
    }

    if (isLeader) {
      try {
        const config = getSystemConfig();
        const minCredits = config.minimumTeachingCredits || 12;
        const maxCredits = config.maximumTeachingCredits || 18;

        // Run all 7 database fetches concurrently
        const [
          faculties,
          departments,
          totalSessions,
          completedSessions,
          reportsTodayCount,
          pendingTeachingLoads,
          leavesAwaitingHR
        ] = await Promise.all([
          prisma.faculty.findMany({
            include: {
              user: true,
              department: true,
              courseoffering: {
                include: {
                  course: true
                }
              }
            }
          }),
          prisma.department.findMany({
            include: {
              courseoffering: true
            }
          }),
          prisma.classsession.count(),
          prisma.classsession.count({ where: { status: 'COMPLETED' } }),
          prisma.dailyactivityreport.count({
            where: {
              reportdate: {
                gte: (() => {
                  const d = new Date();
                  d.setHours(0,0,0,0);
                  return d;
                })()
              }
            }
          }),
          prisma.teachingload.count({ where: { status: 'PENDING' } }),
          prisma.leaverequest.count({ where: { status: 'PENDING_HR' } })
        ]);

        const facultyCredits = faculties.map(f => {
          const credits = f.courseoffering.reduce((sum, co) => sum + (co.course?.credits || 0), 0);
          const coursesCount = f.courseoffering.length;
          return {
            facultyid: f.facultyid,
            fullname: f.fullname || f.user.username,
            department: f.department?.name || 'N/A',
            credits,
            coursesCount,
            isOverloaded: credits > maxCredits,
            isUnderutilized: credits < minCredits
          };
        });

        const overloadedFaculty = facultyCredits.filter(fc => fc.isOverloaded);
        const underutilizedFaculty = facultyCredits.filter(fc => fc.isUnderutilized);

        const coursesByDepartment = departments.map(d => ({
          name: d.name,
          code: d.code,
          count: d.courseoffering.length
        }));

        const attendanceCompliance = totalSessions > 0 ? Number(((completedSessions / totalSessions) * 100).toFixed(1)) : 100;
        const totalCredits = facultyCredits.reduce((sum, fc) => sum + fc.credits, 0);
        const averageCredits = faculties.length > 0 ? Number((totalCredits / faculties.length).toFixed(1)) : 0;
        const missingActivityReports = Math.max(0, faculties.length - reportsTodayCount);

        const metrics = {
          totalFaculty: faculties.length,
          activeFaculty: faculties.filter(f => f.isactive).length,
          pendingTeachingLoads,
          leavesAwaitingHR,
          missingActivityReports,
          attendanceCompliance,
          averageCredits,
          overloadedFacultyCount: overloadedFaculty.length
        };

        const data = {
          minCredits,
          maxCredits,
          facultyCredits,
          overloadedFaculty,
          underutilizedFaculty,
          coursesByDepartment,
          metrics
        };

        const fullResponse = { success: true, data };

        if (redisConnection && redisConnection.status === 'ready') {
          await redisConnection.setex(cacheKey, 30, JSON.stringify(fullResponse));
          await releaseLock(cacheKey);
        }

        return res.status(200).json(fullResponse);
      } catch (error) {
        if (redisConnection && redisConnection.status === 'ready') {
          await releaseLock(cacheKey);
        }
        throw error;
      }
    } else {
      for (let attempt = 0; attempt < 10; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const cached = await redisConnection!.get(cacheKey);
        if (cached) {
          res.setHeader('Content-Type', 'application/json');
          return res.status(200).send(cached);
        }
      }
      return res.status(200).json({ success: true, data: { facultyCredits: [], overloadedFaculty: [], underutilizedFaculty: [], coursesByDepartment: [], metrics: {} } });
    }
  } catch (error: any) {
    console.error('getWorkloadAnalytics Error:', error);
    return sendError(res, error.message || 'Failed to fetch workload analytics');
  }
};

// 12. Faculty Timeline/History
export const getFacultyHistory = async (req: Request, res: Response<ApiResponse>) => {
  const { facultyId } = req.params;
  const fid = parseInt(facultyId as string, 10);

  if (isNaN(fid)) {
    return sendError(res, 'Invalid faculty ID', 'INVALID_INPUT', 400);
  }

  try {
    const faculty = await prisma.faculty.findUnique({
      where: { facultyid: fid },
      include: {
        user: true,
        department: true
      }
    });

    if (!faculty) {
      return sendError(res, 'Faculty member not found', 'NOT_FOUND', 404);
    }

    const offerings = await prisma.courseoffering.findMany({
      where: { instructorid: fid },
      include: {
        course: true,
        semester: true
      }
    });

    const offeringIds = offerings.map(o => o.courseofferingid);

    const classSessions = await prisma.classsession.findMany({
      where: {
        courseofferingid: { in: offeringIds }
      },
      include: {
        attendance: true
      }
    });

    const sessionsByOffering = new Map<number, any[]>();
    classSessions.forEach(session => {
      const list = sessionsByOffering.get(session.courseofferingid) || [];
      list.push(session);
      sessionsByOffering.set(session.courseofferingid, list);
    });

    const semesterHistory = offerings.map(co => {
      const sessions = sessionsByOffering.get(co.courseofferingid) || [];
      let totalExpected = 0;
      let totalPresent = 0;
      sessions.forEach(session => {
        const presentCount = session.attendance.filter((a: any) => a.status === 'PRESENT').length;
        totalExpected += session.attendance.length;
        totalPresent += presentCount;
      });
      const attendanceRate = totalExpected > 0 ? Number(((totalPresent / totalExpected) * 100).toFixed(1)) : 100;

      return {
        semester: co.semester?.name || 'N/A',
        courseName: co.course?.name || 'N/A',
        courseCode: co.course?.code || 'N/A',
        credits: co.course?.credits || 0,
        status: co.status,
        attendanceRate
      };
    });

    const teachingLoads = await prisma.teachingload.findMany({
      where: { facultyid: fid },
      include: {
        semester: true,
        teachingassignment: {
          include: {
            courseoffering: {
              include: {
                course: true
              }
            }
          }
        }
      },
      orderBy: { createdat: 'desc' }
    });

    const loadHistory = teachingLoads.map(tl => ({
      teachingloadid: tl.teachingloadid,
      semester: tl.semester?.name || 'N/A',
      status: tl.status,
      date: tl.createdat,
      courses: tl.teachingassignment.map(ta => ta.courseoffering?.course?.name || 'N/A')
    }));

    const leaves = await prisma.leaverequest.findMany({
      where: { userid: faculty.userid },
      orderBy: { createdat: 'desc' }
    });

    const leaveHistory = leaves.map(l => ({
      leaverequestid: l.leaverequestid,
      startdate: l.startdate,
      enddate: l.enddate,
      leavetype: l.leavetype,
      status: l.status,
      createdat: l.createdat
    }));

    const activityReports = await prisma.dailyactivityreport.findMany({
      where: { facultyid: fid },
      include: {
        dailyreportactivity: true
      },
      orderBy: { reportdate: 'desc' }
    });

    const reportHistory = activityReports.map(r => ({
      dailyactivityreportid: r.dailyactivityreportid,
      reportdate: r.reportdate,
      summary: r.summary,
      status: r.status,
      activities: r.dailyreportactivity.map(a => a.title || a.detail || 'N/A')
    }));

    const totalSessions = classSessions.length;
    const completedSessions = classSessions.filter(s => s.status === 'COMPLETED').length;
    const attendanceCompletionRate = totalSessions > 0 ? Number(((completedSessions / totalSessions) * 100).toFixed(1)) : 100;

    const quizCount = await prisma.quiz.count({
      where: {
        courseoffering: {
          instructorid: fid
        }
      }
    });

    const creditHours = offerings.reduce((sum, co) => sum + (co.course?.credits || 0), 0);

    const enrollments = await prisma.courseenrollment.findMany({
      where: {
        courseoffering: {
          instructorid: fid
        },
        status: 'ENROLLED'
      },
      select: {
        studentid: true
      }
    });
    const uniqueStudents = new Set(enrollments.map(e => e.studentid));
    const studentCount = uniqueStudents.size;

    const ticketCount = await prisma.ticket.count({
      where: {
        assignee_id: faculty.userid
      }
    });

    const teachingLoadApprovals = await prisma.teachingload.count({
      where: {
        facultyid: fid,
        status: 'APPROVED'
      }
    });

    return sendSuccess(res, {
      faculty: {
        facultyid: faculty.facultyid,
        fullname: faculty.fullname || faculty.user.username,
        employeenumber: faculty.employeenumber || 'N/A',
        department: faculty.department?.name || 'N/A'
      },
      semesterHistory,
      loadHistory,
      leaveHistory,
      reportHistory,
      stats: {
        totalCoursesTaught: offerings.length,
        totalLeavesTaken: leaves.filter(l => l.status === 'APPROVED').length,
        totalReportsSubmitted: activityReports.length,
        attendanceCompletionRate,
        quizCount,
        creditHours,
        studentCount,
        ticketCount,
        teachingLoadApprovals
      }
    });
  } catch (error: any) {
    console.error('getFacultyHistory Error:', error);
    return sendError(res, error.message || 'Failed to fetch faculty history details');
  }
};
