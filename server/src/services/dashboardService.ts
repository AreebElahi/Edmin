import prisma from '../config/prisma.js';

export const getStudentDashboardData = async (userId: number) => {
  // 1. Get student profile from user id
  const student = await prisma.student.findFirst({
    where: { userid: userId, isactive: true },
    select: {
      studentid: true,
      fullname: true,
      avatar: true,
      rollnumber: true,
      program: { select: { name: true } },
      department: { select: { name: true } },
    },
  });

  if (!student) {
    throw new Error('Student profile not found');
  }

  const studentId = student.studentid;

  // 2. Fetch active course enrollments
  const enrollments = await prisma.courseenrollment.findMany({
    where: { studentid: studentId, isactive: true },
    select: {
      courseofferingid: true,
      gradepoints: true,
      grade: true,
      courseoffering: {
        select: {
          course: {
            select: { courseid: true, code: true, name: true, credits: true },
          },
          semester: {
            select: { name: true },
          },
        },
      },
    },
  });

  const offeringIds = enrollments.map((e) => e.courseofferingid);

  // 3-8. Fetch remaining data concurrently
  const [
    assignments,
    quizzes,
    summaries,
    schedule,
    notifications,
    unreadNotificationsCount
  ] = await Promise.all([
    offeringIds.length > 0 ? prisma.assignment.findMany({
      where: { courseofferingid: { in: offeringIds }, isactive: true },
      select: {
        assignmentid: true,
        title: true,
        duedate: true,
        maxmarks: true,
        assignmentsubmission: {
          where: { studentid: studentId, isactive: true },
          select: { assignmentsubmissionid: true, status: true },
        },
        courseoffering: {
          select: { course: { select: { code: true, name: true } } },
        },
      },
    }) : Promise.resolve([] as any[]),
    
    offeringIds.length > 0 ? prisma.quiz.findMany({
      where: { courseofferingid: { in: offeringIds }, isactive: true },
      select: {
        quizid: true,
        title: true,
        duration: true,
        totalmarks: true,
        quizattempt: {
          where: { studentid: studentId, isactive: true },
          select: { quizattemptid: true },
        },
        courseoffering: {
          select: { course: { select: { code: true, name: true } } },
        },
      },
    }) : Promise.resolve([] as any[]),
    
    prisma.attendancesummary.findMany({
      where: { studentid: studentId, isactive: true },
    }),
    
    offeringIds.length > 0 ? prisma.timetable.findMany({
      where: { courseofferingid: { in: offeringIds }, isactive: true },
      select: {
        timetableid: true,
        dayofweek: true,
        starttime: true,
        endtime: true,
        room: true,
        courseoffering: {
          select: { course: { select: { code: true, name: true } } },
        },
      },
      orderBy: [{ dayofweek: 'asc' }, { starttime: 'asc' }],
      take: 5,
    }) : Promise.resolve([] as any[]),
    
    prisma.notification.findMany({
      where: { userid: userId, isactive: true },
      orderBy: { createdat: 'desc' },
      take: 5,
      select: {
        notificationid: true,
        title: true,
        message: true,
        isread: true,
        createdat: true,
      },
    }),
    
    prisma.notification.count({
      where: { userid: userId, isactive: true, isread: false },
    })
  ]);

  let submittedAssignments = 0;
  let pendingAssignments = 0;
  let overdueAssignments = 0;
  const now = new Date();

  assignments.forEach((a: any) => {
    const hasSubmission = a.assignmentsubmission && a.assignmentsubmission.length > 0;
    const isGraded = hasSubmission && a.assignmentsubmission[0].status === 'GRADED';
    if (isGraded) {
      // Graded assignments do not count as pending/submitted
    } else if (hasSubmission) {
      submittedAssignments++;
    } else {
      const isOverdue = new Date(a.duedate) < now;
      if (isOverdue) {
        overdueAssignments++;
      } else {
        pendingAssignments++;
      }
    }
  });

  let completedQuizzes = 0;
  let upcomingQuizzes = 0;

  quizzes.forEach((q: any) => {
    const hasAttempt = q.quizattempt && q.quizattempt.length > 0;
    if (hasAttempt) {
      completedQuizzes++;
    } else {
      upcomingQuizzes++;
    }
  });

  let totalClasses = 0;
  let totalPresent = 0;
  summaries.forEach((s: any) => {
    totalClasses += s.totalclasses ?? 0;
    totalPresent += s.totalpresent ?? 0;
  });
  const attendancePercentage = totalClasses > 0 
    ? Math.round((totalPresent / totalClasses) * 10000) / 100 
    : 0;

  let totalCredits = 0;
  let weightedGradePoints = 0;
  enrollments.forEach((e: any) => {
    const credits = e.courseoffering?.course?.credits ?? 3;
    const gp = e.gradepoints ?? 0.0;
    if (e.grade && e.grade !== 'N/A') {
      totalCredits += credits;
      weightedGradePoints += gp * credits;
    }
  });
  const gpa = totalCredits > 0 ? Math.round((weightedGradePoints / totalCredits) * 100) / 100 : 0.0;

  return {
    profile: {
      fullname: student.fullname,
      avatar: student.avatar,
      rollnumber: student.rollnumber,
      program: student.program?.name || 'N/A',
      department: student.department?.name || 'N/A',
    },
    metrics: {
      activeCourses: enrollments.length,
      pendingAssignments,
      submittedAssignments,
      overdueAssignments,
      upcomingQuizzes,
      completedQuizzes,
      attendancePercentage,
      gpa,
      unreadNotificationsCount,
    },
    courses: enrollments.map((e) => ({
      courseid: e.courseoffering.course.courseid,
      courseOfferingId: e.courseofferingid,
      code: e.courseoffering.course.code,
      name: e.courseoffering.course.name,
      credits: e.courseoffering.course.credits,
      semester: e.courseoffering.semester.name,
    })),
    assignments: assignments.slice(0, 5).map((a) => ({
      assignmentid: a.assignmentid,
      title: a.title,
      duedate: a.duedate,
      maxmarks: a.maxmarks,
      courseCode: a.courseoffering.course.code,
      courseName: a.courseoffering.course.name,
      status: (a.assignmentsubmission.length > 0 && a.assignmentsubmission[0].status === 'GRADED') ? 'graded' : (a.assignmentsubmission.length > 0 ? 'submitted' : (new Date(a.duedate) < now ? 'overdue' : 'pending')),
    })),
    quizzes: quizzes.slice(0, 5).map((q) => ({
      quizid: q.quizid,
      title: q.title,
      duration: q.duration,
      totalmarks: q.totalmarks,
      courseCode: q.courseoffering.course.code,
      courseName: q.courseoffering.course.name,
      attempted: q.quizattempt.length > 0,
    })),
    schedule: schedule.map((s) => ({
      timetableid: s.timetableid,
      dayofweek: s.dayofweek,
      starttime: s.starttime,
      endtime: s.endtime,
      room: s.room,
      courseCode: s.courseoffering.course.code,
      courseName: s.courseoffering.course.name,
    })),
    notifications: notifications.map((n) => ({
      notificationid: n.notificationid,
      title: n.title,
      message: n.message,
      isread: n.isread ?? false,
      createdat: n.createdat,
    })),
  };
};

export const getFacultyDashboardData = async (userId: number) => {
  // 1. Fetch faculty, notifications, and recent leaves concurrently
  const [faculty, notifications, recentLeaves] = await Promise.all([
    prisma.faculty.findFirst({
      where: { userid: userId, isactive: true },
      include: { department: true },
    }),
    prisma.notification.findMany({
      where: { userid: userId, isactive: true },
      orderBy: { createdat: 'desc' },
      take: 5,
    }),
    prisma.leaverequest.findMany({
      where: { userid: userId, isactive: true },
      orderBy: { createdat: 'desc' },
      take: 3,
    })
  ]);

  if (!faculty) {
    throw new Error('Faculty profile not found');
  }

  const deptMemberships = await prisma.departmentmember.findMany({
    where: { userid: userId, isactive: true, subrole: { not: null } }
  });

  let subRole = null;
  if (faculty.department?.hodid === userId || deptMemberships.some(m => m.subrole === 'HOD')) {
    subRole = 'HOD';
  } else if (faculty.department?.supervisorid === userId || deptMemberships.some(m => m.subrole === 'SUPERVISOR')) {
    subRole = 'SUPERVISOR';
  }

  // 2. Fetch taught courses
  const offerings = await prisma.courseoffering.findMany({
    where: {
      OR: [
        { facultyid: faculty.facultyid },
        { instructorid: faculty.facultyid }
      ],
      isactive: true,
    },
    include: {
      course: true,
      assignment: { where: { isactive: true } },
      quiz: { where: { isactive: true } },
    },
  });

  const courses = offerings.map(o => o.course);
  const assignments = offerings.flatMap(o => o.assignment.map(a => ({ ...a, course: o.course })));
  const quizzes = offerings.flatMap(o => o.quiz.map(q => ({ ...q, course: o.course })));

  return {
    profile: { ...faculty, subRole },
    courses,
    assignments,
    quizzes,
    notifications,
    recentLeaves,
  };
};

export const getAdminDashboardData = async (userId: number) => {
  const latencyStart = Date.now();

  // Run all database calls concurrently to minimize round-trips and optimize performance
  const [
    totalStudentsRaw,
    totalFacultyRaw,
    totalCoursesRaw,
    openTicketsRaw,
    recentAuditLogs,
    notifications
  ] = await Promise.all([
    prisma.$queryRaw<{count: number}[]>`SELECT COUNT(*)::int as count FROM student WHERE isactive = true`,
    prisma.$queryRaw<{count: number}[]>`SELECT COUNT(*)::int as count FROM faculty WHERE isactive = true`,
    prisma.$queryRaw<{count: number}[]>`SELECT COUNT(*)::int as count FROM course WHERE isactive = true`,
    prisma.$queryRaw<{count: number}[]>`SELECT COUNT(*)::int as count FROM "Ticket" WHERE status = 'OPEN'`,
    prisma.auditLog.findMany({
      orderBy: { created_at: 'desc' },
      take: 5,
      include: {
        actor: {
          select: {
            username: true
          }
        }
      }
    }),
    prisma.notification.findMany({
      where: { userid: userId, isactive: true },
      orderBy: { createdat: 'desc' },
      take: 5,
    })
  ]);

  const totalStudents = totalStudentsRaw[0]?.count || 0;
  const totalFaculty = totalFacultyRaw[0]?.count || 0;
  const totalCourses = totalCoursesRaw[0]?.count || 0;
  const openTickets = openTicketsRaw[0]?.count || 0;

  const dbLatencyMs = Date.now() - latencyStart;

  const systemActivity = recentAuditLogs.map(log => ({
    id: log.id,
    action: log.action,
    table: log.table_name,
    performedBy: log.actor?.username || 'System',
    timestamp: log.created_at,
  }));

  return {
    metrics: {
      totalStudents,
      totalFaculty,
      totalCourses,
      openTickets,
      dbLatencyMs,
    },
    systemActivity,
    notifications,
  };
};

export const getHrDashboardSummary = async (userId: number) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Total Employees excludes students
  const staffRoles: any[] = ['FACULTY', 'ADMIN', 'HR'];
  
  const totalEmployees = await prisma.user.count({ where: { role: { in: staffRoles }, accountStatus: 'ACTIVE' } });
  const pastTotalEmployees = await prisma.user.count({ where: { role: { in: staffRoles }, accountStatus: 'ACTIVE', createdat: { lt: thirtyDaysAgo } } });
  
  const facultyStaff = await prisma.user.count({ where: { role: 'FACULTY', accountStatus: 'ACTIVE' } });
  const pastFacultyStaff = await prisma.user.count({ where: { role: 'FACULTY', accountStatus: 'ACTIVE', createdat: { lt: thirtyDaysAgo } } });

  const hrStaff = await prisma.user.count({ where: { role: 'HR', accountStatus: 'ACTIVE' } });
  const pastHrStaff = await prisma.user.count({ where: { role: 'HR', accountStatus: 'ACTIVE', createdat: { lt: thirtyDaysAgo } } });

  const departments = await prisma.department.count({ where: { isactive: true } });
  const pastDepartments = await prisma.department.count({ where: { isactive: true, createdat: { lt: thirtyDaysAgo } } });

  const totalEmployeesDelta = totalEmployees - pastTotalEmployees;
  const facultyStaffDelta = facultyStaff - pastFacultyStaff;
  const hrStaffDelta = hrStaff - pastHrStaff;
  const departmentsDelta = departments - pastDepartments;

  return {
    totalEmployees,
    totalEmployeesDelta: totalEmployeesDelta === 0 ? null : (totalEmployeesDelta > 0 ? `+${totalEmployeesDelta}` : `${totalEmployeesDelta}`),
    facultyStaff,
    facultyStaffDelta: facultyStaffDelta === 0 ? null : (facultyStaffDelta > 0 ? `+${facultyStaffDelta}` : `${facultyStaffDelta}`),
    hrStaff,
    hrStaffTrend: hrStaffDelta === 0 ? "Stable" : (hrStaffDelta > 0 ? `+${hrStaffDelta}` : `${hrStaffDelta}`),
    departments,
    departmentsDelta: departmentsDelta === 0 ? null : (departmentsDelta > 0 ? `+${departmentsDelta}` : `${departmentsDelta}`),
    departmentsDeltaLabel: "Newly created"
  };
};

export const getHrLeavesToday = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const leaves = await prisma.leaverequest.findMany({
    where: {
      status: 'APPROVED',
      startdate: { lte: tomorrow },
      enddate: { gte: today },
      isactive: true
    },
    include: {
      user: {
        select: { username: true, userDepartment: { select: { name: true } } }
      }
    }
  });

  return leaves.map(leave => ({
    employeeId: leave.userid,
    name: leave.user?.username || 'Unknown',
    department: (leave.user as any)?.userDepartment?.name || 'N/A',
    leaveType: leave.leavetype,
    returnDate: leave.enddate
  }));
};

export const getHrCompliance = async () => {
  // Fetch all active staff to calculate average tenure
  const staffRoles: any[] = ['FACULTY', 'ADMIN', 'HR'];
  const staff = await prisma.user.findMany({
    where: { role: { in: staffRoles }, accountStatus: 'ACTIVE' },
    select: { userid: true, createdat: true }
  });

  let totalTenureDays = 0;
  const now = new Date();

  staff.forEach(s => {
    const tenureMs = now.getTime() - new Date(s.createdat).getTime();
    totalTenureDays += (tenureMs / (1000 * 60 * 60 * 24));
  });

  const avgTenureYears = staff.length > 0 ? (totalTenureDays / staff.length / 365).toFixed(1) : '0.0';

  // For gender, we will try to fetch from facultyemploymentrecord as a sample
  const records = await prisma.facultyemploymentrecord.findMany({
    where: { isactive: true },
    select: { gender: true }
  });

  let femaleCount = 0;
  let maleCount = 0;
  let totalWithGender = 0;

  records.forEach(r => {
    if (r.gender === 'FEMALE') { femaleCount++; totalWithGender++; }
    else if (r.gender === 'MALE') { maleCount++; totalWithGender++; }
  });

  let genderRatio = 'N/A';
  if (totalWithGender > 0) {
    const fPercent = Math.round((femaleCount / totalWithGender) * 100);
    const mPercent = 100 - fPercent;
    genderRatio = `${fPercent}% F / ${mPercent}% M`;
  }

  return {
    genderRatio,
    avgTenureYears: `${avgTenureYears} Years`
  };
};

export const getHrApprovalsPending = async () => {
  // Fetch pending leaves
  const pendingLeavesRaw = await prisma.leaverequest.findMany({
    where: { status: 'PENDING', isactive: true },
    include: { user: { select: { username: true, userDepartment: { select: { name: true } } } } }
  });

  const leaveApprovals = pendingLeavesRaw.map(leave => ({
    id: `leave-${leave.leaverequestid}`,
    type: 'leave',
    title: `Leave Request: ${leave.user?.username || 'Unknown Employee'}`,
    subtitle: `${(leave.user as any)?.userDepartment?.name || 'N/A'} • Waiting for HR sign-off`,
    requiresAction: true,
    reviewUrl: `/dashboard/hr/leaves`
  }));

  // Fetch pending (DRAFT) payrolls
  let payrollApprovals: any[] = [];
  try {
    const pendingPayrollsRaw = await (prisma as any).payroll.findMany({
      where: { status: 'DRAFT' }
    });
    
    payrollApprovals = pendingPayrollsRaw.map((payroll: any) => ({
      id: `payroll-${payroll.payrollid}`,
      type: 'payroll',
      title: `Payroll Disbursement - Month ${payroll.month}/${payroll.year}`,
      subtitle: `Finance Dept • Waiting for HR sign-off`,
      requiresAction: true,
      reviewUrl: `/dashboard/hr/payroll`
    }));
  } catch (err) {
      console.warn("Payroll table might not be accessible or empty.", err);
  }

  return [...leaveApprovals, ...payrollApprovals];
};
