import prisma from '../../config/prisma.js';

export const getPendingApprovals = async (userId: number) => {
  // Find departments where this user is the supervisor
  const departments = await prisma.department.findMany({
    where: { supervisorid: userId }
  });

  if (departments.length === 0) {
    return {
      teachingLoads: [],
      enrollments: [],
      activityReports: [],
      leaves: []
    };
  }

  const departmentIds = departments.map(d => d.departmentid);

  // Get pending teaching loads
  const teachingLoads = await prisma.teachingload.findMany({
    where: {
      status: 'PENDING',
      faculty: { departmentid: { in: departmentIds } }
    },
    include: {
      faculty: true,
      teachingassignment: {
        include: { courseoffering: { include: { course: true } } }
      }
    }
  });

  // Return empty enrollments for now since courseenrollment doesn't have a PENDING status
  const enrollments: any[] = [];

  // Get pending activity reports
  const activityReports = await prisma.dailyactivityreport.findMany({
    where: {
      status: 'PENDING_SUPERVISOR',
      faculty: { departmentid: { in: departmentIds } }
    },
    include: {
      faculty: true
    }
  });

  // Get pending leaves
  const leaves = await prisma.leaverequest.findMany({
    where: {
      status: 'PENDING',
      user: {
        faculty: {
          some: { departmentid: { in: departmentIds } }
        }
      }
    },
    include: {
      user: {
        include: {
          faculty: true
        }
      }
    }
  });

  return {
    teachingLoads: teachingLoads.map(tl => ({
      id: tl.teachingloadid,
      facultyName: tl.faculty.fullname,
      courses: tl.teachingassignment.map(ta => ta.courseoffering.course.name),
      createdAt: tl.createdat
    })),
    enrollments: enrollments.map(e => ({
      id: e.courseenrollmentid,
      studentName: e.student.fullname,
      rollNo: e.student.rollnumber,
      courseName: e.courseoffering.course.name,
      createdAt: e.createdat
    })),
    activityReports: activityReports.map(r => ({
      id: r.dailyactivityreportid,
      facultyName: r.faculty.fullname,
      date: r.reportdate,
      summary: r.summary,
      createdAt: r.createdat
    })),
    leaves: leaves.map(l => ({
      id: l.leaverequestid,
      facultyName: l.user.faculty[0]?.fullname || l.user.username,
      type: l.leavetype,
      startDate: l.startdate,
      endDate: l.enddate,
      reason: l.reason,
      createdAt: l.createdat
    }))
  };
};
