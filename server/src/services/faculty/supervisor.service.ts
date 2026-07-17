import prisma from '../../config/prisma.js';
import { approveTeachingLoad, rejectTeachingLoad as rejectTeachingLoadWorkflow } from '../workflows/teachingLoadWorkflow.service.js';
import { approveActivityReport, rejectActivityReport } from '../workflows/activityReportWorkflow.service.js';
import { approveEnrollmentRequest, rejectEnrollmentRequest } from '../enrollment.service.js';

const logAudit = async (userId: number, action: string, tableName: string, recordId: number, oldValues: any, newValues: any) => {
    try {
        await prisma.auditlog.create({
            data: {
                userid: userId,
                action,
                tablename: tableName,
                recordid: recordId,
                oldvalues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
                newvalues: newValues ? JSON.parse(JSON.stringify(newValues)) : null
            }
        });
    } catch(err) {
        console.error("Audit log failed", err);
    }
};

const getSupervisorDepartment = async (userId: number) => {
    const department = await prisma.department.findFirst({
        where: { supervisorid: userId },
    });
    if (!department) throw new Error('Not assigned as Supervisor to any department');
    return department;
};

// ==========================================
// 1. DASHBOARD & ANALYTICS
// ==========================================

export const getDashboardStats = async (userId: number) => {
    const department = await getSupervisorDepartment(userId);
    const deptId = department.departmentid;

    const totalFaculty = await prisma.faculty.count({ where: { departmentid: deptId, isactive: true } });
    
    const activeOfferings = await prisma.courseoffering.findMany({
        where: { course: { departmentid: deptId }, isactive: true },
        include: { _count: { select: { courseenrollment: { where: { isactive: true } } } } }
    });
    
    const activeCourses = activeOfferings.length;
    const totalStudents = activeOfferings.reduce((sum, o) => sum + o._count.courseenrollment, 0);
    
    const pendingLoads = await prisma.teachingload.count({
        where: {
            status: { in: ['PENDING', 'SUBMITTED', 'PENDING_SUPERVISOR'] },
            supervisorstatus: 'PENDING',
            faculty: { departmentid: deptId }
        }
    });
    const pendingEnrollments = await prisma.enrollmentrequest.count({ where: { status: 'PENDING', courseoffering: { course: { departmentid: deptId } } } });
    const pendingReports = await prisma.dailyactivityreport.count({ where: { status: 'PENDING_SUPERVISOR', faculty: { departmentid: deptId } } });
    const pendingLeaves = await prisma.leaverequest.count({ where: { status: 'PENDING', user: { faculty: { departmentid: deptId } } } });

    const pendingApprovals = pendingLoads + pendingEnrollments + pendingReports + pendingLeaves;

    return {
        departmentName: department.name,
        stats: {
            totalFaculty,
            totalStudents,
            activeCourses,
            pendingApprovals,
            details: { pendingLoads, pendingEnrollments, pendingReports, pendingLeaves }
        }
    };
};

export const getAnalytics = async (userId: number) => {
    const department = await getSupervisorDepartment(userId);
    const deptId = department.departmentid;

    // 1. Faculty stats
    const totalFaculty = await prisma.faculty.count({ where: { departmentid: deptId, isactive: true } });
    const pendingLoads = await prisma.teachingload.count({
        where: {
            status: { in: ['PENDING', 'SUBMITTED', 'PENDING_SUPERVISOR'] },
            supervisorstatus: 'PENDING',
            faculty: { departmentid: deptId }
        }
    });
    const pendingReports = await prisma.dailyactivityreport.count({ where: { status: 'PENDING_SUPERVISOR', faculty: { departmentid: deptId } } });
    
    const today = new Date();
    const leaveToday = await prisma.leaverequest.count({
        where: {
            status: 'APPROVED',
            startdate: { lte: today },
            enddate: { gte: today },
            user: { faculty: { departmentid: deptId } }
        }
    });

    // 2. Student stats
    const totalStudents = await prisma.student.count({
        where: { departmentid: deptId, isactive: true }
    });
    const pendingEnrollments = await prisma.enrollmentrequest.count({
        where: { status: 'PENDING', courseoffering: { course: { departmentid: deptId } } }
    });

    // Attendance alerts (students with average attendance below 75%)
    const summaries = await prisma.attendancesummary.findMany({
        where: { courseoffering: { course: { departmentid: deptId } } },
        select: { totalpresent: true, totalclasses: true }
    });
    const attendanceAlerts = summaries.filter(s => {
        const classes = s.totalclasses || 0;
        const present = s.totalpresent || 0;
        if (classes === 0) return false;
        return (present / classes) < 0.75;
    }).length;

    // 3. Courses stats
    const runningCourses = await prisma.courseoffering.count({
        where: { course: { departmentid: deptId }, isactive: true }
    });

    const pendingLeaves = await prisma.leaverequest.count({
        where: { status: 'PENDING', user: { faculty: { departmentid: deptId } } }
    });

    // Health Score calculation
    let healthScore = 100;
    const totalPending = pendingLoads + pendingReports + pendingLeaves + pendingEnrollments;
    healthScore -= (totalPending * 2);
    healthScore -= (attendanceAlerts * 5);
    healthScore -= (leaveToday * 3);
    if (healthScore < 30) healthScore = 30;
    if (healthScore > 100) healthScore = 100;

    return {
        departmentName: department.name,
        healthScore,
        faculty: {
            total: totalFaculty,
            pendingReviews: pendingLoads + pendingReports,
            leaveToday
        },
        students: {
            total: totalStudents,
            enrollmentRequests: pendingEnrollments,
            attendanceAlerts
        },
        courses: {
            running: runningCourses,
            behindSchedule: 0
        },
        operations: {
            pendingTeachingLoads: pendingLoads,
            pendingReports: pendingReports,
            pendingLeaves: pendingLeaves
        }
    };
};

// ==========================================
// 2. ACADEMIC MONITORING (Courses, Timetable, Students)
// ==========================================

export const getDepartmentCourses = async (userId: number) => {
    const department = await getSupervisorDepartment(userId);
    
    const offerings = await prisma.courseoffering.findMany({
        where: { course: { departmentid: department.departmentid }, isactive: true },
        include: {
            course: true,
            section: true,
            teachingassignment: { include: { teachingload: { include: { faculty: true } } } },
            _count: { select: { courseenrollment: { where: { isactive: true } } } }
        }
    });

    return offerings.map(o => {
        const enrolled = o._count.courseenrollment;
        const capacity = o.section?.capacity || 0;
        const instructors = o.teachingassignment.map(ta => ta.teachingload?.faculty?.fullname).filter(Boolean);
        
        let status = 'ON_TRACK';
        if (instructors.length === 0) {
            status = 'WARNING';
        } else if (enrolled > capacity && capacity > 0) {
            status = 'CRITICAL';
        }

        return {
            id: o.courseofferingid,
            courseCode: o.course.code,
            courseName: o.course.name,
            sectionName: o.section?.name,
            capacity: o.section?.capacity,
            enrolled,
            instructors,
            status
        };
    });
};

export const getDepartmentTimetable = async (userId: number) => {
    const department = await getSupervisorDepartment(userId);
    
    const timetables = await prisma.timetable.findMany({
        where: { courseoffering: { course: { departmentid: department.departmentid } }, isactive: true },
        include: { courseoffering: { include: { course: true, section: true } } }
    });

    const dayMap: Record<string, string> = {
        'MON': 'Monday',
        'TUE': 'Tuesday',
        'WED': 'Wednesday',
        'THU': 'Thursday',
        'FRI': 'Friday',
        'SAT': 'Saturday',
        'SUN': 'Sunday'
    };

    return timetables.map(t => ({
        id: t.timetableid,
        day: dayMap[t.dayofweek] || t.dayofweek,
        startTime: t.starttime,
        endTime: t.endtime,
        room: t.room,
        course: t.courseoffering.course.name,
        section: t.courseoffering.section?.name
    }));
};

export const getDepartmentStudents = async (userId: number) => {
    const department = await getSupervisorDepartment(userId);
    
    // Low attendance / at risk students
    const attendances = await prisma.attendancesummary.findMany({
        where: { courseoffering: { course: { departmentid: department.departmentid } } },
        include: { student: { include: { user: true } }, courseoffering: { include: { course: true } } }
    });

    return attendances.map(a => {
        const attendancePercentage = Math.round(((a.totalpresent || 0) / (a.totalclasses || 1)) * 100);
        const alerts: string[] = [];
        if (attendancePercentage < 75) {
            alerts.push('Low Attendance');
        }
        return {
            studentName: a.student.fullname || a.student.rollnumber,
            rollnumber: a.student.rollnumber,
            courseName: a.courseoffering.course.name,
            attendancePercentage,
            status: attendancePercentage < 75 ? 'AT_RISK' : 'REGULAR',
            alerts
        };
    });
};

export const getDepartmentCalendar = async (userId: number) => {
    const department = await getSupervisorDepartment(userId);
    // Placeholder for actual events / exams
    return { events: [], exams: [], deadlines: [] };
};

// ==========================================
// 3. PENDING APPROVALS / LISTINGS
// ==========================================

export const getPendingApprovals = async (userId: number) => {
    const department = await getSupervisorDepartment(userId);
    const deptId = department.departmentid;

    const teachingLoads = await prisma.teachingload.findMany({
        where: {
            status: { in: ['PENDING', 'SUBMITTED', 'PENDING_SUPERVISOR'] },
            supervisorstatus: 'PENDING',
            faculty: { departmentid: deptId }
        },
        include: { faculty: true, teachingassignment: { include: { courseoffering: { include: { course: true } } } } }
    });

    const enrollments = await prisma.enrollmentrequest.findMany({
        where: { status: 'PENDING', courseoffering: { course: { departmentid: deptId } } },
        include: { student: { include: { user: true } }, courseoffering: { include: { course: true } } }
    });

    const activityReports = await prisma.dailyactivityreport.findMany({
        where: { status: 'PENDING_SUPERVISOR', faculty: { departmentid: deptId } },
        include: { faculty: true }
    });

    const leaves = await prisma.leaverequest.findMany({
        where: { status: 'PENDING', user: { faculty: { departmentid: deptId } } },
        include: { user: { include: { faculty: true } } }
    });

    return {
        teachingLoads: teachingLoads.map(tl => ({
            id: tl.teachingloadid,
            facultyName: tl.faculty.fullname,
            courses: tl.teachingassignment.map(ta => ta.courseoffering.course.name),
            createdAt: tl.createdat,
            status: tl.status === 'PENDING_SUPERVISOR' || tl.status === 'SUBMITTED' ? 'PENDING' : tl.status
        })),
        enrollments: enrollments.map(e => ({
            id: e.enrollmentrequestid, studentName: e.student.fullname || e.student.rollnumber, rollNo: e.student.rollnumber, courseName: e.courseoffering.course.name, createdAt: e.createdat
        })),
        activityReports: activityReports.map(r => ({
            id: r.dailyactivityreportid, facultyName: r.faculty.fullname, date: r.reportdate, summary: r.summary, createdAt: r.createdat
        })),
        leaves: leaves.map(l => ({
            id: l.leaverequestid, facultyName: (l as any).user?.faculty?.fullname || (l as any).user?.username, type: l.leavetype, startDate: l.startdate, endDate: l.enddate, reason: l.reason, createdAt: l.createdat
        }))
    };
};

export const getTeachingLoads = async (userId: number) => {
    const department = await getSupervisorDepartment(userId);
    const teachingLoads = await prisma.teachingload.findMany({
        where: { faculty: { departmentid: department.departmentid } },
        include: { faculty: true, teachingassignment: { include: { courseoffering: { include: { course: true } } } } },
        orderBy: { createdat: 'desc' }
    });

    return teachingLoads.map(tl => ({
        id: tl.teachingloadid,
        facultyName: tl.faculty.fullname,
        totalCredits: tl.teachingassignment.reduce((sum, ta) => sum + (ta.courseoffering.course.credits || 0), 0),
        status: tl.status === 'PENDING_SUPERVISOR' || tl.status === 'SUBMITTED' ? 'PENDING' : tl.status,
        courses: tl.teachingassignment.map(ta => ta.courseoffering.course.name),
        createdAt: tl.createdat
    }));
};

export const getEnrollmentRequests = async (
    userId: number,
    options: { search?: string; status?: string; page?: number; limit?: number } = {}
) => {
    const department = await getSupervisorDepartment(userId);
    const { search, status, page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const whereClause: any = {
        courseoffering: {
            course: {
                departmentid: department.departmentid
            }
        }
    };

    if (status) {
        whereClause.status = status;
    }

    if (search) {
        whereClause.student = {
            OR: [
                { fullname: { contains: search, mode: 'insensitive' } },
                { rollnumber: { contains: search, mode: 'insensitive' } }
            ]
        };
    }

    const [total, requests] = await Promise.all([
        prisma.enrollmentrequest.count({ where: whereClause }),
        prisma.enrollmentrequest.findMany({
            where: whereClause,
            include: {
                student: { include: { user: true } },
                courseoffering: { include: { course: true, section: true } }
            },
            orderBy: { createdat: 'desc' },
            skip,
            take: limit
        })
    ]);

    const items = requests.map(r => ({
        id: r.enrollmentrequestid,
        studentName: r.student.fullname || r.student.rollnumber,
        rollnumber: r.student.rollnumber,
        courseName: r.courseoffering.course.name,
        sectionName: r.courseoffering.section?.name || 'TBD',
        status: r.status,
        createdAt: r.createdat
    }));

    return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};

export const getDepartmentFaculty = async (userId: number) => {
    const department = await getSupervisorDepartment(userId);
    const faculties = await prisma.faculty.findMany({
        where: { departmentid: department.departmentid, isactive: true },
        include: { 
            user: true, 
            teachingload: { 
                where: { status: 'APPROVED' },
                include: { teachingassignment: { include: { courseoffering: { include: { course: true } } } } }
            } 
        }
    });

    return faculties.map(f => {
        const activeLoad = f.teachingload[0];
        const activeCourses = activeLoad ? activeLoad.teachingassignment.map(ta => ta.courseoffering.course.name) : [];
        const totalCredits = activeLoad ? activeLoad.teachingassignment.reduce((sum, ta) => sum + (ta.courseoffering.course.credits || 0), 0) : 0;
        return {
            id: f.facultyid,
            name: f.fullname || f.user.username,
            email: f.user.email,
            activeCourses,
            totalCredits
        };
    });
};

export const getDepartmentActivityReports = async (userId: number) => {
    const department = await getSupervisorDepartment(userId);
    const reports = await prisma.dailyactivityreport.findMany({
        where: { faculty: { departmentid: department.departmentid } },
        include: { faculty: true },
        orderBy: { reportdate: 'desc' }
    });

    return reports.map(r => ({
        id: r.dailyactivityreportid,
        facultyName: r.faculty.fullname,
        date: r.reportdate,
        summary: r.summary,
        content: r.summary,
        status: r.status,
        createdAt: r.createdat
    }));
};

export const getDepartmentLeaves = async (userId: number) => {
    const department = await getSupervisorDepartment(userId);
    const leaves = await prisma.leaverequest.findMany({
        where: { user: { faculty: { departmentid: department.departmentid } } },
        include: { user: { include: { faculty: true } } },
        orderBy: { startdate: 'desc' }
    });

    return leaves.map(l => {
        const diffTime = Math.abs(new Date(l.enddate).getTime() - new Date(l.startdate).getTime());
        const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return {
            id: l.leaverequestid,
            facultyName: (l as any).user?.faculty?.fullname || (l as any).user?.username,
            leaveType: l.leavetype,
            startDate: l.startdate,
            endDate: l.enddate,
            reason: l.reason,
            durationDays,
            status: l.status,
            supervisorComment: (l as any).supervisor_comment || null
        };
    });
};

export const getDepartmentAttendance = async (userId: number) => {
    return getDepartmentStudents(userId);
};

export const getNotifications = async (userId: number) => {
    return prisma.notification.findMany({
        where: { userid: userId, isread: false },
        orderBy: { createdat: 'desc' }
    });
};

export const getApprovalHistory = async (userId: number, entityType: string, entityId: number) => {
    return await (prisma as any).approvalHistory.findMany({
        where: { entityType: entityType, entityId: entityId },
        include: { actor: true },
        orderBy: { createdAt: 'desc' }
    });
};

// ==========================================
// 4. APPROVAL WORKFLOWS (POST / PATCH)
// ==========================================

export const approveEnrollment = async (userId: number, id: number, comment?: string) => {
    const department = await getSupervisorDepartment(userId);
    const request = await prisma.enrollmentrequest.findUnique({ where: { enrollmentrequestid: id }, include: { courseoffering: { include: { course: true } } } });
    if (!request) throw new Error('Request not found');
    if (request.courseoffering.course.departmentid !== department.departmentid) throw new Error('Unauthorized');

    const updated = await approveEnrollmentRequest(id, userId, comment || 'Approved by Supervisor');

    // Create ApprovalHistory
    await prisma.approvalHistory.create({
        data: {
            entityType: 'ENROLLMENT',
            entityId: id,
            action: 'APPROVED',
            comments: comment || 'Approved by Supervisor',
            actorId: userId,
            departmentId: department.departmentid
        }
    });

    return updated;
};

export const rejectEnrollment = async (userId: number, id: number, reason: string) => {
    const department = await getSupervisorDepartment(userId);
    const request = await prisma.enrollmentrequest.findUnique({ where: { enrollmentrequestid: id }, include: { courseoffering: { include: { course: true } } } });
    if (!request || request.courseoffering.course.departmentid !== department.departmentid) throw new Error('Unauthorized');

    const updated = await rejectEnrollmentRequest(id, userId, reason);

    // Create ApprovalHistory
    await prisma.approvalHistory.create({
        data: {
            entityType: 'ENROLLMENT',
            entityId: id,
            action: 'REJECTED',
            comments: reason,
            actorId: userId,
            departmentId: department.departmentid
        }
    });

    return updated;
};

export const getEnrollmentRequestDetail = async (userId: number, id: number) => {
    const department = await getSupervisorDepartment(userId);
    const request = await prisma.enrollmentrequest.findUnique({
        where: { enrollmentrequestid: id },
        include: {
            student: { include: { user: true } },
            courseoffering: {
                include: {
                    course: true,
                    section: true,
                    teachingassignment: { include: { teachingload: { include: { faculty: true } } } }
                }
            }
        }
    });

    if (!request) throw new Error('Enrollment request not found');
    if (request.courseoffering.course.departmentid !== department.departmentid) {
        throw new Error('Unauthorized');
    }

    const history = await prisma.approvalHistory.findMany({
        where: { entityType: 'ENROLLMENT', entityId: id },
        include: { actor: true },
        orderBy: { createdAt: 'desc' }
    });

    // Find all sections offering this course in this department
    const sections = await prisma.courseoffering.findMany({
        where: { courseid: request.courseoffering.courseid, isactive: true },
        include: { section: true }
    });

    const availableSections = sections.map(s => ({
        sectionId: s.section?.sectionid || null,
        sectionName: s.section?.name || 'TBD',
        capacity: s.section?.capacity || 0,
        courseOfferingId: s.courseofferingid
    })).filter(s => s.sectionId !== null);

    return {
        id: request.enrollmentrequestid,
        student: {
            id: request.student.studentid,
            name: request.student.fullname || request.student.rollnumber,
            rollnumber: request.student.rollnumber,
            email: request.student.user.email
        },
        course: {
            id: request.courseoffering.course.courseid,
            code: request.courseoffering.course.code,
            name: request.courseoffering.course.name,
            credits: request.courseoffering.course.credits
        },
        section: {
            id: request.courseoffering.section?.sectionid || null,
            name: request.courseoffering.section?.name || 'TBD',
            capacity: request.courseoffering.section?.capacity || 0
        },
        status: request.status,
        createdAt: request.createdat,
        availableSections,
        history: history.map(h => ({
            id: h.id,
            action: h.action,
            comments: h.comments,
            actorName: h.actor.username || h.actor.email,
            createdAt: h.createdAt
        }))
    };
};

export const changeSection = async (
    userId: number,
    id: number,
    type: 'REQUEST' | 'ENROLLMENT',
    targetSectionId: number
) => {
    const department = await getSupervisorDepartment(userId);
    let courseId = 0;

    if (type === 'REQUEST') {
        const request = await prisma.enrollmentrequest.findUnique({
            where: { enrollmentrequestid: id },
            include: { courseoffering: true }
        });
        if (!request) throw new Error('Enrollment request not found');
        courseId = request.courseoffering.courseid;

        const course = await prisma.course.findUnique({ where: { courseid: courseId } });
        if (!course || course.departmentid !== department.departmentid) throw new Error('Unauthorized');

        const targetOffering = await prisma.courseoffering.findFirst({
            where: { courseid: courseId, sectionid: targetSectionId, isactive: true }
        });
        if (!targetOffering) throw new Error('Target section is not offered for this course');

        const updated = await prisma.enrollmentrequest.update({
            where: { enrollmentrequestid: id },
            data: { courseofferingid: targetOffering.courseofferingid }
        });

        await prisma.approvalHistory.create({
            data: {
                entityType: 'ENROLLMENT',
                entityId: id,
                action: 'SECTION_CHANGED',
                comments: `Section changed to section ID: ${targetSectionId}`,
                actorId: userId,
                departmentId: department.departmentid
            }
        });

        return updated;
    } else {
        const enrollment = await prisma.courseenrollment.findUnique({
            where: { courseenrollmentid: id },
            include: { courseoffering: true }
        });
        if (!enrollment) throw new Error('Course enrollment not found');
        courseId = enrollment.courseoffering.courseid;

        const course = await prisma.course.findUnique({ where: { courseid: courseId } });
        if (!course || course.departmentid !== department.departmentid) throw new Error('Unauthorized');

        const targetOffering = await prisma.courseoffering.findFirst({
            where: { courseid: courseId, sectionid: targetSectionId, isactive: true }
        });
        if (!targetOffering) throw new Error('Target section is not offered for this course');

        const updated = await prisma.courseenrollment.update({
            where: { courseenrollmentid: id },
            data: { courseofferingid: targetOffering.courseofferingid }
        });

        await prisma.approvalHistory.create({
            data: {
                entityType: 'ENROLLMENT',
                entityId: id,
                action: 'SECTION_CHANGED',
                comments: `Section changed to section ID: ${targetSectionId} for active enrollment`,
                actorId: userId,
                departmentId: department.departmentid
            }
        });

        return updated;
    }
};

export const getWithdrawalRequests = async (
    userId: number,
    options: { search?: string; status?: string; page?: number; limit?: number } = {}
) => {
    const department = await getSupervisorDepartment(userId);
    const { search, status, page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const whereClause: any = {
        courseenrollment: {
            courseoffering: {
                course: {
                    departmentid: department.departmentid
                }
            }
        }
    };

    if (status) {
        whereClause.status = status;
    }

    if (search) {
        whereClause.student = {
            OR: [
                { fullname: { contains: search, mode: 'insensitive' } },
                { rollnumber: { contains: search, mode: 'insensitive' } }
            ]
        };
    }

    const [total, requests] = await Promise.all([
        prisma.withdrawalrequest.count({ where: whereClause }),
        prisma.withdrawalrequest.findMany({
            where: whereClause,
            include: {
                student: { include: { user: true } },
                courseenrollment: {
                    include: {
                        courseoffering: {
                            include: { course: true, section: true }
                        }
                    }
                }
            },
            orderBy: { createdat: 'desc' },
            skip,
            take: limit
        })
    ]);

    const items = requests.map(r => ({
        id: r.withdrawalrequestid,
        studentName: r.student.fullname || r.student.rollnumber,
        rollnumber: r.student.rollnumber,
        courseName: r.courseenrollment.courseoffering.course.name,
        sectionName: r.courseenrollment.courseoffering.section?.name || 'TBD',
        reason: r.reason,
        status: r.status,
        createdAt: r.createdat
    }));

    return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};

export const getWithdrawalRequestDetail = async (userId: number, id: number) => {
    const department = await getSupervisorDepartment(userId);
    const request = await prisma.withdrawalrequest.findUnique({
        where: { withdrawalrequestid: id },
        include: {
            student: { include: { user: true } },
            courseenrollment: {
                include: {
                    courseoffering: {
                        include: { course: true, section: true }
                    }
                }
            }
        }
    });

    if (!request) throw new Error('Withdrawal request not found');
    if (request.courseenrollment.courseoffering.course.departmentid !== department.departmentid) {
        throw new Error('Unauthorized');
    }

    const history = await prisma.approvalHistory.findMany({
        where: { entityType: 'WITHDRAWAL', entityId: id },
        include: { actor: true },
        orderBy: { createdAt: 'desc' }
    });

    return {
        id: request.withdrawalrequestid,
        student: {
            id: request.student.studentid,
            name: request.student.fullname || request.student.rollnumber,
            rollnumber: request.student.rollnumber,
            email: request.student.user.email
        },
        course: {
            id: request.courseenrollment.courseoffering.course.courseid,
            code: request.courseenrollment.courseoffering.course.code,
            name: request.courseenrollment.courseoffering.course.name
        },
        section: {
            name: request.courseenrollment.courseoffering.section?.name || 'TBD'
        },
        reason: request.reason,
        comments: request.comments,
        status: request.status,
        createdAt: request.createdat,
        history: history.map(h => ({
            id: h.id,
            action: h.action,
            comments: h.comments,
            actorName: h.actor.username || h.actor.email,
            createdAt: h.createdAt
        }))
    };
};

export const approveWithdrawal = async (userId: number, id: number, comment?: string) => {
    const department = await getSupervisorDepartment(userId);
    const request = await prisma.withdrawalrequest.findUnique({
        where: { withdrawalrequestid: id },
        include: { courseenrollment: { include: { courseoffering: { include: { course: true } } } } }
    });
    if (!request) throw new Error('Withdrawal request not found');
    if (request.courseenrollment.courseoffering.course.departmentid !== department.departmentid) {
        throw new Error('Unauthorized');
    }

    return await prisma.$transaction(async (tx) => {
        const updatedRequest = await tx.withdrawalrequest.update({
            where: { withdrawalrequestid: id },
            data: { status: 'APPROVED', comments: comment }
        });

        await tx.courseenrollment.update({
            where: { courseenrollmentid: request.courseenrollmentid },
            data: { status: 'WITHDRAWN', isactive: false, deletedat: new Date() }
        });

        await tx.approvalHistory.create({
            data: {
                entityType: 'WITHDRAWAL',
                entityId: id,
                action: 'APPROVED',
                comments: comment || 'Approved by Supervisor',
                actorId: userId,
                departmentId: department.departmentid
            }
        });

        return updatedRequest;
    });
};

export const rejectWithdrawal = async (userId: number, id: number, reason: string) => {
    if (!reason) throw new Error('Rejection reason is required');
    const department = await getSupervisorDepartment(userId);
    const request = await prisma.withdrawalrequest.findUnique({
        where: { withdrawalrequestid: id },
        include: { courseenrollment: { include: { courseoffering: { include: { course: true } } } } }
    });
    if (!request) throw new Error('Withdrawal request not found');
    if (request.courseenrollment.courseoffering.course.departmentid !== department.departmentid) {
        throw new Error('Unauthorized');
    }

    const updated = await prisma.withdrawalrequest.update({
        where: { withdrawalrequestid: id },
        data: { status: 'REJECTED', comments: reason }
    });

    await prisma.approvalHistory.create({
        data: {
            entityType: 'WITHDRAWAL',
            entityId: id,
            action: 'REJECTED',
            comments: reason,
            actorId: userId,
            departmentId: department.departmentid
        }
    });

    return updated;
};

export const recommendTeachingLoad = async (userId: number, id: number, comment?: string) => {
    const department = await getSupervisorDepartment(userId);
    const load = await prisma.teachingload.findUnique({ where: { teachingloadid: id }, include: { faculty: true } });
    if (!load || load.faculty.departmentid !== department.departmentid) throw new Error('Unauthorized');

    return await approveTeachingLoad(id, userId, 'FACULTY', comment || 'Recommended by Supervisor');
};

export const rejectTeachingLoad = async (userId: number, id: number, reason: string) => {
    const department = await getSupervisorDepartment(userId);
    const load = await prisma.teachingload.findUnique({ where: { teachingloadid: id }, include: { faculty: true } });
    if (!load || load.faculty.departmentid !== department.departmentid) throw new Error('Unauthorized');

    return await rejectTeachingLoadWorkflow(id, userId, 'FACULTY', reason);
};

export const reviewActivityReport = async (userId: number, id: number, status: 'APPROVED' | 'REJECTED', comment?: string) => {
    const department = await getSupervisorDepartment(userId);
    const report = await prisma.dailyactivityreport.findUnique({ where: { dailyactivityreportid: id }, include: { faculty: true } });
    if (!report || report.faculty.departmentid !== department.departmentid) throw new Error('Unauthorized');

    if (status === 'APPROVED') {
        return await approveActivityReport(id, userId, 'FACULTY', comment || 'Approved by Supervisor');
    } else {
        return await rejectActivityReport(id, userId, 'FACULTY', comment || 'Rejected by Supervisor');
    }
};

export const commentLeave = async (userId: number, id: number, comment: string) => {
    const department = await getSupervisorDepartment(userId);
    const leave = await prisma.leaverequest.findUnique({ where: { leaverequestid: id }, include: { user: { include: { faculty: true } } } });
    if (!leave) throw new Error('Leave request not found');
    if ((leave.user.faculty as any)?.departmentid !== department.departmentid) {
        throw new Error('Leave request does not belong to your department');
    }

    await logAudit(userId, 'COMMENT_LEAVE', 'leaverequest', id, {}, { comment });
    return leave;
};
