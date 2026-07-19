import prisma from '../../config/prisma.js';

export const getAttendanceReport = async () => {
  const departments = await prisma.department.findMany({
    include: {
      student: {
        include: {
          attendance: true
        }
      }
    }
  });

  return departments.map((dept: any) => {
    const allAttendance = dept.student.flatMap((s: any) => s.attendance);
    const total = allAttendance.length;
    const presents = allAttendance.filter((a: any) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const pct = total > 0 ? Number(((presents / total) * 100).toFixed(1)) : 0.0;

    let defaultersCount = 0;
    dept.student.forEach((s: any) => {
      const sAttendance = s.attendance;
      if (sAttendance.length > 0) {
        const sTotal = sAttendance.length;
        const sPresents = sAttendance.filter((a: any) => a.status === 'PRESENT' || a.status === 'LATE').length;
        const sPct = (sPresents / sTotal) * 100;
        if (sPct < 75.0) {
          defaultersCount++;
        }
      }
    });

    return {
      unit: `${dept.name} (${dept.code})`,
      totalStudents: dept.student.length,
      avgAttendance: total > 0 ? `${pct}%` : 'N/A',
      defaulters: `${defaultersCount} students`
    };
  });
};

export const getEnrollmentReport = async () => {
  const offerings = await prisma.courseoffering.findMany({
    where: { isactive: true },
    include: {
      course: true,
      courseenrollment: {
        where: { status: 'ENROLLED' }
      }
    },
    take: 10
  });

  return offerings.map((offering: any) => {
    const enrolled = offering.courseenrollment.length;
    const capacity = offering.capacity || 60;
    return {
      code: offering.course?.code || 'N/A',
      name: offering.course?.name || 'Unknown Course',
      dept: 'Academics',
      enrolled,
      capacity
    };
  });
};

export const getLeaveReportSummary = async () => {
  const grouped = await prisma.leaverequest.groupBy({
    by: ['status'],
    _count: {
      _all: true
    }
  });

  let pending = 0;
  let approved = 0;
  let rejected = 0;

  grouped.forEach((g: any) => {
    if (g.status === 'PENDING') pending = g._count._all;
    if (g.status === 'APPROVED') approved = g._count._all;
    if (g.status === 'REJECTED') rejected = g._count._all;
  });

  const latestRequests = await prisma.leaverequest.findMany({
    orderBy: { createdat: 'desc' },
    take: 10,
    include: {
      user: { select: { username: true } }
    }
  });

  const list = latestRequests.map((l: any) => {
    const start = l.startdate ? new Date(l.startdate) : null;
    const end = l.enddate ? new Date(l.enddate) : null;
    const days = start && end ? Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1 : 1;
    return {
      applicant: l.user?.username || 'Unknown',
      department: 'N/A',
      type: l.leavetype || 'Leave',
      days,
      status: l.status ? l.status.charAt(0) + l.status.slice(1).toLowerCase() : 'Unknown',
      startDate: l.startdate,
      endDate: l.enddate,
    };
  });

  return {
    summary: { pending, approved, rejected },
    list,
  };
};

export const getGradeDistributionReport = async () => {
  const courses = await prisma.course.findMany({
    where: { isactive: true },
    take: 5,
  });

  const courseIds = courses.map((c: any) => c.courseid);

  const enrollments = await prisma.courseenrollment.findMany({
    where: {
      courseoffering: { courseid: { in: courseIds } },
      grade: { not: null },
    },
    select: { grade: true, courseoffering: { select: { courseid: true } } },
    take: 200 * courses.length,
  });

  const enrollmentsByCourse = enrollments.reduce((acc: any, e: any) => {
    const cid = e.courseoffering.courseid;
    if (!acc[cid]) acc[cid] = [];
    acc[cid].push(e);
    return acc;
  }, {});

  return courses.map((c: any) => {
    const courseEnrollments = enrollmentsByCourse[c.courseid] || [];
    const grades = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    
    for (const e of courseEnrollments) {
      const g = (e.grade || '').toUpperCase();
      if (g.startsWith('A')) grades.A++;
      else if (g.startsWith('B')) grades.B++;
      else if (g.startsWith('C')) grades.C++;
      else if (g.startsWith('D')) grades.D++;
      else if (g === 'F' || g === 'FAIL') grades.F++;
    }

    return {
      course: `${c.code} ${c.name}`,
      grades,
      totalRecords: courseEnrollments.length,
    };
  });
};

export const getExportReportData = async () => {
  const [studentCount, facultyCount, courseCount, openTickets] = await Promise.all([
    prisma.student.count({ where: { isactive: true } }),
    prisma.faculty.count({ where: { isactive: true } }),
    prisma.course.count({ where: { isactive: true } }),
    prisma.ticket.count({ where: { status: 'OPEN' } }),
  ]);

  const departments = await prisma.department.findMany({
    where: { isactive: true },
    select: { name: true, code: true },
  });

  return { studentCount, facultyCount, courseCount, openTickets, departments };
};
