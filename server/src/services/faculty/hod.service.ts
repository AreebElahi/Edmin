import prisma from '../../config/prisma.js';

export const getDashboardStats = async (userId: number) => {
  const department = await prisma.department.findFirst({
    where: { hodid: userId },
  });

  if (!department) {
    throw new Error('Not assigned as HOD to any department');
  }

  const totalFaculty = await prisma.faculty.count({
    where: { departmentid: department.departmentid, isactive: true },
  });

  const activeOfferings = await prisma.courseoffering.findMany({
    where: {
      course: { departmentid: department.departmentid },
      isactive: true,
    },
    include: {
      _count: {
        select: { courseenrollment: { where: { isactive: true } } }
      }
    }
  });
  
  const activeCourses = activeOfferings.length;
  
  const totalStudents = activeOfferings.reduce((sum, o) => sum + o._count.courseenrollment, 0);

  const enrollmentAggregate = await prisma.courseenrollment.aggregate({
    where: {
      isactive: true,
      courseoffering: {
        course: { departmentid: department.departmentid },
        isactive: true
      },
      percentage: { not: null }
    },
    _avg: { percentage: true }
  });
  const avgProgress = Math.round(Number(enrollmentAggregate._avg.percentage) || 0);

  return {
    departmentName: department.name,
    stats: {
      totalFaculty,
      totalStudents,
      activeCourses,
      avgProgress,
    }
  };
};

export const getFacultyActivity = async (userId: number) => {
  const department = await prisma.department.findFirst({ where: { hodid: userId } });

  if (!department) {
    throw new Error('Not an HOD');
  }

  const departmentFaculty = await prisma.faculty.findMany({
    where: { departmentid: department.departmentid, isactive: true },
    include: {
      teachingload: {
        where: { status: 'APPROVED' },
        include: {
          teachingassignment: {
            include: {
              courseoffering: {
                include: { course: true }
              }
            }
          }
        }
      },
      user: {
        include: {
          leaverequest: {
            where: {
              status: 'APPROVED',
              startdate: { lte: new Date() },
              enddate: { gte: new Date() }
            }
          }
        }
      },
      dailyactivityreport: {
        orderBy: { reportdate: 'desc' },
        take: 1
      }
    }
  });

  return departmentFaculty.map(f => {
    let status = 'Available';
    let leaveDetails = null;
    if (f.user?.leaverequest && f.user.leaverequest.length > 0) {
      status = 'On Leave';
      leaveDetails = f.user.leaverequest[0];
    }
    
    const latestReport = f.dailyactivityreport && f.dailyactivityreport[0];
    const activityReportStatus = latestReport ? latestReport.status : 'PENDING';
    
    const allAssignments = f.teachingload?.flatMap(tl => tl.teachingassignment) || [];
    const courses = Array.from(new Set(allAssignments.map(ta => ta.courseoffering.course.name))).join(', ');
    
    return {
      id: f.facultyid,
      name: f.fullname || 'Unknown Faculty',
      status,
      leaveDetails,
      activityReportStatus,
      course: courses || 'None',
      load: `${allAssignments.length}/12`
    };
  });
};

export const getUpcomingEvents = async (userId: number) => {
  const department = await prisma.department.findFirst({ where: { hodid: userId } });

  if (!department) {
    throw new Error('Not an HOD');
  }

  return await prisma.departmentevent.findMany({
    where: { departmentid: department.departmentid, date: { gte: new Date() } },
    orderBy: { date: 'asc' },
    take: 5
  });
};

export const getDepartmentCourses = async (userId: number) => {
  const department = await prisma.department.findFirst({ where: { hodid: userId } });
  if (!department) throw new Error('Not an HOD');

  const offerings = await prisma.courseoffering.findMany({
    where: { departmentid: department.departmentid },
    include: {
      course: true,
      faculty: { select: { fullname: true } },
      _count: { select: { courseenrollment: true } },
      semester: true
    }
  });

  return offerings.map(o => ({
    id: o.courseofferingid,
    code: o.course.code,
    name: o.course.name,
    instructor: o.faculty?.fullname || 'Unassigned',
    enrollment: o._count.courseenrollment,
    capacity: o.capacity,
    status: o.status
  }));
};

export const getDepartmentLeaves = async (userId: number) => {
  const department = await prisma.department.findFirst({ where: { hodid: userId } });
  if (!department) throw new Error('Not an HOD');

  const leaves = await prisma.leaverequest.findMany({
    where: {
      user: {
        faculty: {
          some: { departmentid: department.departmentid }
        }
      }
    },
    include: {
      user: {
        include: { faculty: true }
      }
    },
    orderBy: { createdat: 'desc' }
  });

  return leaves.map(l => ({
    id: l.leaverequestid,
    facultyName: l.user.faculty[0]?.fullname || l.user.username,
    leaveType: l.leavetype,
    startDate: l.startdate,
    endDate: l.enddate,
    status: l.status,
    reason: l.reason
  }));
};

export const getDepartmentTeachingLoads = async (userId: number) => {
  const department = await prisma.department.findFirst({ where: { hodid: userId } });
  if (!department) throw new Error('Not an HOD');

  const loads = await prisma.teachingload.findMany({
    where: {
      faculty: { departmentid: department.departmentid }
    },
    include: {
      faculty: true,
      teachingassignment: {
        include: {
          courseoffering: {
            include: { course: true }
          }
        }
      }
    },
    orderBy: { createdat: 'desc' }
  });

  return loads.map(l => ({
    id: l.teachingloadid,
    facultyName: l.faculty.fullname || 'Unknown',
    courses: l.teachingassignment.map(ta => ta.courseoffering.course.name).join(', '),
    totalCredits: l.teachingassignment.reduce((sum, ta) => sum + ta.courseoffering.course.credits, 0),
    status: l.status,
    submittedDate: l.createdat
  }));
};

export const getDepartmentStudents = async (userId: number) => {
  const department = await prisma.department.findFirst({ where: { hodid: userId } });
  if (!department) throw new Error('Not an HOD');

  const enrollments = await prisma.courseenrollment.findMany({
    where: {
      courseoffering: { departmentid: department.departmentid }
    },
    include: {
      student: { include: { user: true } },
      courseoffering: { include: { course: true } }
    },
    orderBy: { createdat: 'desc' },
    take: 100
  });

  const attendance = await prisma.attendancesummary.findMany({
    where: {
      courseoffering: { departmentid: department.departmentid }
    },
    include: {
      student: { include: { user: true } },
      courseoffering: { include: { course: true } }
    },
    orderBy: { totalabsent: 'desc' },
    take: 100
  });

  return {
    enrollments,
    attendance
  };
};

export const getDepartmentActivityReports = async (userId: number) => {
  const department = await prisma.department.findFirst({ where: { hodid: userId } });
  if (!department) throw new Error('Not an HOD');

  const reports = await prisma.dailyactivityreport.findMany({
    where: { departmentid: department.departmentid },
    include: { faculty: true },
    orderBy: { reportdate: 'desc' },
    take: 100
  });

  return reports.map(r => ({
    id: r.dailyactivityreportid,
    facultyName: r.faculty.fullname || 'Unknown',
    date: r.reportdate,
    summary: r.summary,
    status: r.status
  }));
};
