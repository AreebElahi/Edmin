import { Request, Response } from 'express';
import { sendSuccess, sendError, ApiResponse } from '../../contracts/api.contracts.js';
import prisma from '../../config/prisma.js';
import { approveEnrollmentRequest, rejectEnrollmentRequest } from '../../services/enrollment.service.js';

// 1. Student Directory
export const getStudentDirectory = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: true,
        department: true,
        semester: true,
        courseenrollment: {
          include: {
            courseoffering: {
              include: {
                course: true
              }
            }
          }
        },
        attendance: true
      }
    });

    const data = students.map(s => {
      const completedEnrollments = s.courseenrollment.filter(e => e.status === 'COMPLETED');
      
      let totalPoints = 0;
      let totalCredits = 0;
      completedEnrollments.forEach(e => {
        const credits = e.courseoffering?.course?.credits || 3;
        if (e.gradepoints !== null && e.gradepoints !== undefined) {
          totalPoints += e.gradepoints * credits;
          totalCredits += credits;
        }
      });
      const cgpa = totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0.0;

      const totalSessions = s.attendance.length;
      const presentSessions = s.attendance.filter(a => a.status === 'PRESENT').length;
      const attendanceRate = totalSessions > 0 ? Number(((presentSessions / totalSessions) * 100).toFixed(1)) : 100;

      return {
        studentid: s.studentid,
        fullname: s.fullname || s.user.username,
        rollnumber: s.rollnumber || 'N/A',
        email: s.user.email,
        department: s.department?.name || 'N/A',
        departmentCode: s.department?.code || 'N/A',
        semester: s.semester?.name || 'N/A',
        status: s.status || 'ACTIVE',
        cgpa,
        attendanceRate
      };
    });

    return sendSuccess(res, data);
  } catch (error: any) {
    console.error('getStudentDirectory Error:', error);
    return sendError(res, error.message || 'Failed to fetch student directory');
  }
};

// 2. Enrollment Requests
export const getEnrollmentRequests = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const requests = await prisma.enrollmentrequest.findMany({
      include: {
        student: {
          include: {
            user: true,
            department: true
          }
        },
        courseoffering: {
          include: {
            course: true,
            semester: true
          }
        }
      },
      orderBy: {
        createdat: 'desc'
      }
    });

    const data = requests.map(r => ({
      enrollmentrequestid: r.enrollmentrequestid,
      studentName: r.student.fullname || r.student.user.username,
      rollnumber: r.student.rollnumber || 'N/A',
      department: r.student.department?.name || 'N/A',
      courseName: r.courseoffering.course.name,
      courseCode: r.courseoffering.course.code,
      semester: r.courseoffering.semester.name,
      status: r.status,
      createdat: r.createdat
    }));

    return sendSuccess(res, data);
  } catch (error: any) {
    console.error('getEnrollmentRequests Error:', error);
    return sendError(res, error.message || 'Failed to fetch enrollment requests');
  }
};

// 3. Override Enrollment Request Status
export const overrideEnrollmentRequest = async (req: Request, res: Response<ApiResponse>) => {
  const { id } = req.params;
  const { action, comment } = req.body; // action: 'APPROVE' | 'REJECT'
  const requestId = parseInt(id as string, 10);
  const adminUserId = (req as any).user.userId;

  if (action !== 'APPROVE' && action !== 'REJECT') {
    return sendError(res, 'Action must be APPROVE or REJECT', 'INVALID_INPUT', 400);
  }

  try {
    let updated;
    if (action === 'APPROVE') {
      updated = await approveEnrollmentRequest(requestId, adminUserId, comment || 'Approved by Admin Override');
    } else {
      updated = await rejectEnrollmentRequest(requestId, adminUserId, comment || 'Rejected by Admin Override');
    }

    // Resolve open escalations
    await prisma.escalation.updateMany({
      where: { relatedid: requestId, relatedtype: 'ENROLLMENT', status: 'OPEN' },
      data: { status: 'RESOLVED' }
    });

    return sendSuccess(res, { message: `Enrollment status successfully overridden to ${action}`, updated });
  } catch (error: any) {
    console.error('overrideEnrollmentRequest Error:', error);
    return sendError(res, error.message || 'Failed to override enrollment request');
  }
};

// 4. Academic Progress
export const getAcademicProgress = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: true,
        department: true,
        semester: true,
        courseenrollment: {
          include: {
            courseoffering: {
              include: {
                course: true
              }
            }
          }
        }
      }
    });

    const data = students.map(s => {
      const completedEnrollments = s.courseenrollment.filter(e => e.status === 'COMPLETED');
      const activeEnrollments = s.courseenrollment.filter(e => e.status === 'ENROLLED');
      
      let completedCredits = 0;
      let totalPoints = 0;
      let totalCredits = 0;
      completedEnrollments.forEach(e => {
        const credits = e.courseoffering?.course?.credits || 3;
        completedCredits += credits;
        if (e.gradepoints !== null && e.gradepoints !== undefined) {
          totalPoints += e.gradepoints * credits;
          totalCredits += credits;
        }
      });

      const cgpa = totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0.0;

      let semPoints = 0;
      let semCredits = 0;
      activeEnrollments.forEach(e => {
        const credits = e.courseoffering?.course?.credits || 3;
        if (e.gradepoints !== null && e.gradepoints !== undefined) {
          semPoints += e.gradepoints * credits;
          semCredits += credits;
        }
      });
      const semesterGpa = semCredits > 0 ? Number((semPoints / semCredits).toFixed(2)) : 0.0;

      const failedCourses = s.courseenrollment.filter(e => e.grade === 'F').length;
      const remainingCredits = Math.max(0, 130 - completedCredits);

      let graduationStatus = 'On Track';
      if (completedCredits >= 130 && cgpa >= 2.0) {
        graduationStatus = 'Eligible';
      } else if (cgpa < 2.0) {
        graduationStatus = 'Delayed';
      }

      return {
        studentid: s.studentid,
        fullname: s.fullname || s.user.username,
        rollnumber: s.rollnumber || 'N/A',
        department: s.department?.name || 'N/A',
        semester: s.semester?.name || 'N/A',
        completedCredits,
        cgpa,
        semesterGpa,
        failedCourses,
        remainingCredits,
        graduationStatus,
        isProbation: cgpa < 2.0 && completedCredits > 0
      };
    });

    return sendSuccess(res, data);
  } catch (error: any) {
    console.error('getAcademicProgress Error:', error);
    return sendError(res, error.message || 'Failed to fetch academic progress');
  }
};

// 5. Promotion & Graduation
export const getPromotionAndGraduation = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: true,
        department: true,
        semester: true,
        courseenrollment: {
          include: {
            courseoffering: {
              include: {
                course: true
              }
            }
          }
        }
      }
    });

    const list = students.map(s => {
      const completedEnrollments = s.courseenrollment.filter(e => e.status === 'COMPLETED');
      
      let completedCredits = 0;
      let totalPoints = 0;
      let totalCredits = 0;
      completedEnrollments.forEach(e => {
        const credits = e.courseoffering?.course?.credits || 3;
        completedCredits += credits;
        if (e.gradepoints !== null && e.gradepoints !== undefined) {
          totalPoints += e.gradepoints * credits;
          totalCredits += credits;
        }
      });

      const cgpa = totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0.0;
      const failedCount = s.courseenrollment.filter(e => e.grade === 'F').length;

      let status = 'PROMOTION_ELIGIBLE';
      if (cgpa < 1.7 && completedCredits > 0) {
        status = 'REPEAT_SEMESTER';
      } else if (cgpa < 2.0 && completedCredits > 0) {
        status = 'PROBATION';
      } else if (completedCredits >= 130 && cgpa >= 2.0) {
        status = s.status === 'ALUMNI' ? 'GRADUATED' : 'GRADUATION_ELIGIBLE';
      }

      return {
        studentid: s.studentid,
        fullname: s.fullname || s.user.username,
        rollnumber: s.rollnumber || 'N/A',
        department: s.department?.name || 'N/A',
        semester: s.semester?.name || 'N/A',
        cgpa,
        completedCredits,
        remainingCredits: Math.max(0, 130 - completedCredits),
        failedCount,
        status
      };
    });

    const eligibleForPromotion = list.filter(item => item.status === 'PROMOTION_ELIGIBLE');
    const repeatSemester = list.filter(item => item.status === 'REPEAT_SEMESTER');
    const probationStudents = list.filter(item => item.status === 'PROBATION');
    const graduationEligible = list.filter(item => item.status === 'GRADUATION_ELIGIBLE');
    const graduatedStudents = list.filter(item => item.status === 'GRADUATED');

    return sendSuccess(res, list);
  } catch (error: any) {
    console.error('getPromotionAndGraduation Error:', error);
    return sendError(res, error.message || 'Failed to fetch promotion candidates');
  }
};

// 6. Attendance Analytics
export const getAttendanceAnalytics = async (req: Request, res: Response<ApiResponse>) => {
  try {


    const students = await prisma.student.findMany({
      include: {
        user: true,
        department: true,
        attendance: true
      }
    });

    const result = students.map(s => {
      const totalClasses = s.attendance.length;
      const presentClasses = s.attendance.filter(a => a.status === 'PRESENT').length;
      const attendanceRate = totalClasses > 0 ? Number(((presentClasses / totalClasses) * 100).toFixed(1)) : 100;
      
      let riskStatus = 'GOOD';
      if (attendanceRate < 75) riskStatus = 'CRITICAL';
      else if (attendanceRate < 80) riskStatus = 'WARNING';

      return {
        studentid: s.studentid,
        fullname: s.fullname || s.user.username,
        rollnumber: s.rollnumber || 'N/A',
        department: s.department?.name || 'N/A',
        semester: 'Current', // Placeholder or use s.currentsemester if exists
        totalClasses,
        presentClasses,
        attendanceRate,
        riskStatus
      };
    });

    return sendSuccess(res, result);
  } catch (error: any) {
    console.error('getAttendanceAnalytics Error:', error);
    return sendError(res, error.message || 'Failed to fetch attendance analytics');
  }
};

// 7. At Risk Students
export const getAtRiskStudents = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: true,
        department: true,
        semester: true,
        attendance: true,
        courseenrollment: true,
        studentinvoice: true
      }
    });

    const flagged: any[] = [];

    for (const s of students) {
      const reasons: string[] = [];
      
      const totalAtt = s.attendance.length;
      const presentAtt = s.attendance.filter(a => a.status === 'PRESENT').length;
      const attendanceRate = totalAtt > 0 ? Number(((presentAtt / totalAtt) * 100).toFixed(1)) : 100;
      if (attendanceRate < 75 && totalAtt > 0) {
        reasons.push(`Low Attendance (${attendanceRate}%)`);
      }

      const failedCount = s.courseenrollment.filter(e => e.grade === 'F').length;
      if (failedCount > 2) {
        reasons.push(`Multiple Failures (${failedCount} courses)`);
      }

      const outstandingInvoices = s.studentinvoice.filter(i => ['PENDING', 'PARTIAL', 'OVERDUE'].includes(i.status));
      const totalOutstanding = outstandingInvoices.reduce((sum, inv) => sum + (inv.totalamount - inv.amountpaid), 0);
      if (totalOutstanding > 0) {
        reasons.push(`Fee Defaulter ($${totalOutstanding.toFixed(2)})`);
      }

      const hasEnrollmentsForSemester = s.courseenrollment.some(e => e.isactive);
      if (!hasEnrollmentsForSemester && s.semesterid) {
        reasons.push('Missing Semester Enrollment');
      }

      const lastLogin = s.user.lastLoginAt;
      const inactiveDays = lastLogin ? Math.floor((Date.now() - new Date(lastLogin).getTime()) / (1000 * 60 * 60 * 24)) : 999;
      if (inactiveDays > 30) {
        reasons.push(`Inactive (${inactiveDays} days since last login)`);
      }

      if (reasons.length > 0) {
        flagged.push({
          studentid: s.studentid,
          fullname: s.fullname || s.user.username,
          rollnumber: s.rollnumber || 'N/A',
          department: s.department?.name || 'N/A',
          attendanceRate,
          reasons,
          riskLevel: reasons.length >= 3 ? 'HIGH' : reasons.length === 2 ? 'MEDIUM' : 'LOW'
        });
      }
    }

    return sendSuccess(res, flagged);
  } catch (error: any) {
    console.error('getAtRiskStudents Error:', error);
    return sendError(res, error.message || 'Failed to fetch at risk students');
  }
};

// 8. Scholarships Oversight
export const getScholarships = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const scholarships = await prisma.scholarship.findMany({
      include: {
        student: {
          include: {
            user: true,
            department: true
          }
        }
      }
    });

    const data = scholarships.map(sch => ({
      scholarshipid: sch.scholarshipid,
      discountpercentage: sch.discountpercentage,
      isactive: sch.isactive,
      studentName: sch.student.fullname || sch.student.user.username,
      rollnumber: sch.student.rollnumber || 'N/A',
      department: sch.student.department?.name || 'N/A',
      email: sch.student.user.email
    }));

    return sendSuccess(res, data);
  } catch (error: any) {
    console.error('getScholarships Error:', error);
    return sendError(res, error.message || 'Failed to fetch scholarships list');
  }
};

// 9. Dynamic 360 Student Timeline Profile
export const getStudentTimeline = async (req: Request, res: Response<ApiResponse>) => {
  const { studentId } = req.params;
  const sid = parseInt(studentId as string, 10);

  if (isNaN(sid)) {
    return sendError(res, 'Invalid student ID', 'INVALID_INPUT', 400);
  }

  try {
    const student = await prisma.student.findUnique({
      where: { studentid: sid },
      include: {
        user: true,
        department: true,
        semester: true,
        courseenrollment: {
          include: {
            courseoffering: {
              include: {
                course: true,
                semester: true
              }
            }
          }
        },
        attendance: {
          include: {
            classsession: true
          }
        },
        studentinvoice: {
          include: {
            payments: true
          }
        },
        scholarship: true,
        quizattempt: true
      }
    });

    if (!student) {
      return sendError(res, 'Student not found', 'NOT_FOUND', 404);
    }

    // Support tickets created by the student
    const tickets = await prisma.ticket.findMany({
      where: { requester_id: student.userid },
      include: {
        assignee: true
      },
      orderBy: { created_at: 'desc' }
    });

    // Student specific audit logs
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { table_name: 'student', record_id: sid },
          { table_name: 'user', record_id: student.userid }
        ]
      },
      orderBy: { created_at: 'desc' },
      take: 50
    });

    const completed = student.courseenrollment.filter(e => e.status === 'COMPLETED');
    let totalCredits = 0;
    let totalPoints = 0;
    completed.forEach(e => {
      const cr = e.courseoffering?.course?.credits || 3;
      totalCredits += cr;
      if (e.gradepoints !== null && e.gradepoints !== undefined) {
        totalPoints += e.gradepoints * cr;
      }
    });
    const cgpa = totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0.0;

    const totalSessions = student.attendance.length;
    const presentCount = student.attendance.filter(a => a.status === 'PRESENT').length;
    const attendanceRate = totalSessions > 0 ? Number(((presentCount / totalSessions) * 100).toFixed(1)) : 100;

    const invoicesFormatted = student.studentinvoice.map(inv => ({
      invoiceid: inv.invoiceid,
      totalamount: inv.totalamount,
      amountpaid: inv.amountpaid,
      status: inv.status,
      duedate: inv.duedate,
      payments: inv.payments.map((p: any) => ({
        paymentid: p.paymentid,
        amount: p.amount,
        method: p.method,
        createdat: p.createdat
      }))
    }));

    return sendSuccess(res, {
      student: {
        studentid: student.studentid,
        fullname: student.fullname || student.user.username,
        rollnumber: student.rollnumber || 'N/A',
        email: student.user.email,
        department: student.department?.name || 'N/A',
        departmentCode: student.department?.code || 'N/A',
        semester: student.semester?.name || 'N/A',
        avatar: student.avatar,
        status: student.status || 'ACTIVE',
        cgpa,
        completedCredits: totalCredits,
        attendanceRate
      },
      enrollmentHistory: student.courseenrollment.map(e => ({
        courseenrollmentid: e.courseenrollmentid,
        courseName: e.courseoffering.course.name,
        courseCode: e.courseoffering.course.code,
        credits: e.courseoffering.course.credits,
        semester: e.courseoffering.semester.name,
        status: e.status,
        grade: e.grade || 'N/A',
        gradepoints: e.gradepoints
      })),
      attendanceLogs: student.attendance.map(a => ({
        attendanceid: a.attendanceid,
        date: a.classsession?.sessiondate || new Date(),
        topic: a.classsession?.topic || 'N/A',
        status: a.status
      })),
      invoices: invoicesFormatted,
      scholarships: student.scholarship.map(sch => ({
        scholarshipid: sch.scholarshipid,
        discountpercentage: sch.discountpercentage,
        isactive: sch.isactive
      })),
      tickets: tickets.map(t => ({
        id: t.id,
        subject: t.subject,
        status: t.status,
        priority: t.priority,
        created_at: t.created_at,
        assignee: t.assignee?.username || 'Unassigned'
      })),
      auditLogs: auditLogs.map(a => ({
        auditlogid: a.id,
        action: a.action,
        createdat: a.created_at,
        newvalues: a.snapshot,
        oldvalues: {}
      })),
      quizAttempts: student.quizattempt.map(q => ({
        quizattemptid: q.quizattemptid,
        score: q.score,
        attemptdate: q.createdat
      }))
    });
  } catch (error: any) {
    console.error('getStudentTimeline Error:', error);
    return sendError(res, error.message || 'Failed to fetch student timeline');
  }
};
