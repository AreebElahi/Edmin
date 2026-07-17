import { Request, Response, NextFunction } from 'express';
import { sendError } from '../contracts/api.contracts.js';
import prisma from '../config/prisma.js';

export const requireDepartmentRole = (role: 'HOD' | 'SUPERVISOR' | 'ANY_LEADER') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userRole = req.user?.role;
      const userId = req.user?.userId;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'UNAUTHORIZED', 401);
      }

      if (userRole === 'ADMIN' || userRole === 'SYSTEM_ADMIN') {
        return next();
      }

      const resourceId = Number(req.params.id);

      let departmentId: number | null | undefined;

      let facultyId: number | undefined;
      if (userRole !== 'ADMIN' && userRole !== 'SYSTEM_ADMIN') {
        const faculty = await prisma.faculty.findFirst({
          where: { userid: userId }
        });
        if (faculty) {
          facultyId = faculty.facultyid;
        }
      }

      // 1. If resourceId is provided, resolve department via the resource
      if (!isNaN(resourceId) && req.params.id) {
        if (req.originalUrl.includes('enrollment')) {
          const enrollmentRequest = await prisma.enrollmentrequest.findUnique({
            where: { enrollmentrequestid: resourceId },
            include: { student: true }
          });

          if (!enrollmentRequest) {
            return sendError(res, 'Enrollment request not found', 'NOT_FOUND', 404);
          }

          departmentId = enrollmentRequest.student?.departmentid;
        } else if (req.originalUrl.includes('teaching-load')) {
          const teachingLoad = await prisma.teachingload.findUnique({
            where: { teachingloadid: resourceId },
            include: { faculty: true }
          });

          if (!teachingLoad) {
            return sendError(res, 'Teaching load request not found', 'NOT_FOUND', 404);
          }

          departmentId = teachingLoad.faculty?.departmentid;
        } else if (req.originalUrl.includes('activity-report')) {
          const report = await prisma.dailyactivityreport.findUnique({
            where: { dailyactivityreportid: resourceId },
            include: { department: true }
          });

          if (!report) {
            return sendError(res, 'Activity report not found', 'NOT_FOUND', 404);
          }

          departmentId = report.department?.departmentid;
        } else if (req.originalUrl.includes('leave')) {
          const leave = await prisma.leaverequest.findUnique({
            where: { leaverequestid: resourceId },
            include: { user: { include: { departmentmember: true, faculty: true } } }
          });

          if (!leave) {
            return sendError(res, 'Leave request not found', 'NOT_FOUND', 404);
          }
          
          if (leave.user?.faculty) {
            departmentId = leave.user.faculty.departmentid;
          } else if (leave.user?.departmentmember && leave.user.departmentmember.length > 0) {
            departmentId = leave.user.departmentmember[0].departmentid;
          }
        } else if (req.originalUrl.includes('withdrawal')) {
          const withdrawalRequest = await prisma.withdrawalrequest.findUnique({
            where: { withdrawalrequestid: resourceId },
            include: { student: true }
          });

          if (!withdrawalRequest) {
            return sendError(res, 'Withdrawal request not found', 'NOT_FOUND', 404);
          }

          departmentId = withdrawalRequest.student?.departmentid;
        } else {
          return sendError(res, 'Unsupported resource for department role check', 'BAD_REQUEST', 400);
        }

        if (!departmentId) {
          return sendError(res, 'Resource is not associated with any department', 'BAD_REQUEST', 400);
        }

        const department = await prisma.department.findUnique({
          where: { departmentid: departmentId }
        });

        if (!department) {
          return sendError(res, 'Department not found', 'NOT_FOUND', 404);
        }

        if (!facultyId) {
          return sendError(res, `Forbidden: User is not associated with a faculty profile`, 'FORBIDDEN', 403);
        }

        if (role === 'HOD' || role === 'ANY_LEADER') {
          if (department.hodid === userId) {
            return next();
          }
        }
        if (role === 'SUPERVISOR' || role === 'ANY_LEADER') {
          if (department.supervisorid === userId) {
            return next();
          }
        }

        return sendError(res, `Forbidden: Requires department ${role} role`, 'FORBIDDEN', 403);
      } 
      
      // 2. If no resourceId is provided, verify the user holds the role in ANY department
      // NOTE: supervisorid/hodid reference user.userid directly, not facultyid
      else {
        let departments: any[] = [];
        if (role === 'HOD' || role === 'ANY_LEADER') {
          const hodDepts = await prisma.department.findMany({
            where: { hodid: userId }
          });
          departments.push(...hodDepts);
        }
        if (role === 'SUPERVISOR' || role === 'ANY_LEADER') {
          const supDepts = await prisma.department.findMany({
            where: { supervisorid: userId }
          });
          departments.push(...supDepts);
        }

        if (departments.length === 0) {
          return sendError(res, `Forbidden: Requires department ${role} role`, 'FORBIDDEN', 403);
        }

        // Attach department info to the request for the controller to use if needed
        (req as any).userDepartments = departments;
        
        return next();
      }
    } catch (error) {
      console.error('requireDepartmentRole error:', error);
      return sendError(res, 'Internal server error during authorization', 'INTERNAL_SERVER_ERROR', 500);
    }
  };
};
