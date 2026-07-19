import prisma from '../../config/prisma.js';

export const getCourses = async (userId: number) => {
  const faculty = await prisma.faculty.findFirst({
    where: { userid: userId, isactive: true },
  });

  if (!faculty) return [];

  const offerings = await prisma.courseoffering.findMany({
    where: {
      OR: [
        { facultyid: faculty.facultyid },
        { instructorid: faculty.facultyid },
      ],
      isactive: true,
    },
    include: {
      course: true,
      semester: true,
      _count: {
        select: { 
            courseenrollment: { where: { isactive: true } },
            assignment: { where: { isactive: true } },
            quiz: { where: { isactive: true } }
        },
      },
    },
  });

  return offerings.map(o => ({
    id: o.courseofferingid.toString(),
    name: o.course.name,
    code: o.course.code,
    description: o.course.description || 'No description available.',
    students: o._count.courseenrollment,
    assignmentsCount: o._count.assignment,
    quizzesCount: o._count.quiz,
    semester: o.semester.name,
    progress: -1, // TODO(Phase10): Compute real progress metric based on assignment/quiz completion
    color: 'from-blue-600 to-slate-600',
  }));
};

export const getSchedule = async (userId: number) => {
  const faculty = await prisma.faculty.findFirst({
    where: { userid: userId, isactive: true },
  });

  if (!faculty) throw new Error('Faculty profile not found');

  const schedule = await prisma.timetable.findMany({
    where: {
      courseoffering: {
        OR: [
          { facultyid: faculty.facultyid },
          { instructorid: faculty.facultyid },
        ],
        isactive: true,
      },
      isactive: true,
    },
    include: {
      courseoffering: {
        include: { course: true, semester: true },
      },
    },
    orderBy: [
      { dayofweek: 'asc' },
      { starttime: 'asc' },
    ],
  });

  return schedule.map(s => ({
    id: s.timetableid.toString(),
    day: s.dayofweek,
    startTime: s.starttime,
    endTime: s.endtime,
    room: s.room,
    courseId: s.courseoffering.course.code,
    courseName: s.courseoffering.course.name,
    type: 'Lecture',
    semester: s.courseoffering.semester.name,
  }));
};

export const getAvailableTeachingCourses = async () => {
  const offerings = await prisma.courseoffering.findMany({
    where: { isactive: true },
    include: {
      course: true,
      semester: true,
    },
    take: 20,
  });

  return offerings.map(o => ({
    id: o.courseofferingid.toString(),
    code: o.course.code,
    name: o.course.name,
    credits: o.course.credits,
    semesterId: o.semesterid,
  }));
};


export const getMyPendingApprovals = async (userId: number, skip: number, limit: number) => {
  const faculty = await prisma.faculty.findFirst({
    where: { userid: userId, isactive: true },
  });

  if (!faculty) throw new Error('Faculty profile not found');

  const teachingLoads = await prisma.teachingload.findMany({
    skip,
    take: limit,
    where: {
      facultyid: faculty.facultyid,
      OR: [
        { supervisorstatus: 'PENDING' },
        { hodstatus: 'PENDING' }
      ]
    },
    select: {
      teachingloadid: true,
      status: true,
      supervisorstatus: true,
      hodstatus: true,
      semester: { select: { name: true, year: true } },
      teachingassignment: {
        select: {
          courseofferingid: true,
          courseoffering: { select: { course: { select: { name: true, code: true } } } }
        }
      }
    }
  });

  const leaveRequests = await prisma.leaverequest.findMany({
    where: { userid: userId, status: 'PENDING' },
    select: {
      leaverequestid: true,
      status: true,
      leavetype: true,
      startdate: true,
      enddate: true
    }
  });

  return { teachingLoads, leaveRequests };
};

export const getCourseDetails = async (userId: number, courseOfferingIdStr: string) => {
  const faculty = await prisma.faculty.findFirst({
    where: { userid: userId, isactive: true },
  });

  if (!faculty) throw new Error('Faculty profile not found');

  const courseOfferingId = parseInt(courseOfferingIdStr);

  const courseOffering = await prisma.courseoffering.findFirst({
    where: {
      courseofferingid: courseOfferingId,
      OR: [
        { facultyid: faculty.facultyid },
        { instructorid: faculty.facultyid },
      ],
      isactive: true,
    },
    include: {
      course: true,
      semester: true,
      _count: {
        select: { 
            courseenrollment: { where: { isactive: true } },
            assignment: { where: { isactive: true } },
            quiz: { where: { isactive: true } }
        },
      },
    },
  });

  if (!courseOffering) throw new Error('Course offering not found or unauthorized');

  const courseData = {
    id: courseOffering.courseofferingid.toString(),
    name: courseOffering.course.name,
    code: courseOffering.course.code,
    description: courseOffering.course.description || 'No description available.',
    students: courseOffering._count.courseenrollment,
    assignmentsCount: courseOffering._count.assignment,
    quizzesCount: courseOffering._count.quiz,
    semester: courseOffering.semester.name,
    progress: -1,
    color: 'from-blue-600 to-slate-600',
  };

  // Fetch assignments, quizzes, sessions, and students concurrently
  const [assignments, quizzes, aiquizzes, sessions, enrollments] = await Promise.all([
    // Assignments
    prisma.assignment.findMany({
      where: { courseofferingid: courseOfferingId, isactive: true },
    }),
    // Quizzes
    prisma.quiz.findMany({
      where: { courseofferingid: courseOfferingId, isactive: true },
    }),
    // AI Quizzes
    prisma.aiquiz.findMany({
      where: { facultyid: faculty.facultyid, isactive: true },
      include: { courseoffering: { include: { course: true } } }
    }),
    // Sessions
    prisma.classsession.findMany({
      where: { courseofferingid: courseOfferingId, isactive: true },
      include: { 
        attendance: true 
      },
      orderBy: { sessiondate: 'desc' },
    }),
    // Students
    prisma.courseenrollment.findMany({
      where: { courseofferingid: courseOfferingId, isactive: true, student: { isactive: true } },
      include: {
        student: {
          include: {
            attendance: { 
              where: { classsession: { courseofferingid: courseOfferingId } }
            }
          }
        },
        courseoffering: {
          include: { course: true, semester: true },
        },
      },
    })
  ]);

  const assignmentsData = assignments.map(a => ({
    id: a.assignmentid.toString(),
    title: a.title,
    courseId: courseOffering.course.code,
    dueDate: a.duedate,
    status: a.isactive ? 'Active' : 'Draft',
    totalMarks: a.maxmarks,
  }));

  const aiQuizzesFiltered = aiquizzes.filter(a => a.courseoffering?.courseofferingid === courseOfferingId);
  
  const quizzesData = [
    ...quizzes.map(q => ({
      id: q.quizid.toString(),
      title: q.title,
      courseId: courseOffering.course.code,
      status: q.isactive ? 'Published' : 'Draft',
      totalMarks: q.totalmarks,
      isAi: false
    })),
    ...aiQuizzesFiltered.map(q => ({
      id: q.aiquizid.toString(),
      title: q.title,
      courseId: courseOffering.course.code,
      status: q.status === 'PUBLISHED' ? 'Published' : 'Draft',
      totalMarks: q.questioncount,
      isAi: true
    }))
  ];

  const sessionsData = sessions.map(s => {
    const presentCount = s.attendance.filter((a: any) => a.status === 'PRESENT').length;
    const isCompleted = s.attendance.length > 0;
    return {
      id: s.classsessionid.toString(),
      classsessionid: s.classsessionid,
      courseName: courseOffering.course.name,
      courseCode: courseOffering.course.code,
      sessionDate: s.sessiondate.toISOString(),
      startTime: s.starttime?.toISOString() || null,
      endTime: s.endtime?.toISOString() || null,
      status: isCompleted ? 'COMPLETED' : 'PENDING',
      topic: s.topic,
      attendanceCount: presentCount,
      totalStudents: s.attendance.length > 0 ? s.attendance.length : courseOffering._count.courseenrollment,
    };
  });

  const studentsData = enrollments.map(e => {
    const studentAttendance = e.student.attendance || [];
    const presentCount = studentAttendance.filter((a: any) => a.status === 'PRESENT').length;
    const attendancePercentage = studentAttendance.length > 0 
      ? Math.round((presentCount / studentAttendance.length) * 100) 
      : 0;

    return {
      id: `${e.courseenrollmentid}`,
      studentId: e.student.rollnumber || 'N/A',
      name: e.student.fullname || 'Unknown',
      email: `${e.student.rollnumber}@edmin.edu`,
      course: e.courseoffering.course.name,
      semester: e.courseoffering.semester?.name || 'Current',
      status: 'Active',
      attendance: attendancePercentage,
      attendedClasses: presentCount,
      totalClasses: studentAttendance.length,
      assignmentScore: null,
      quizScore: null,
      midtermScore: null,
      grade: e.grade || 'N/A',
      avatar: e.student.avatar,
    };
  });

  return {
    course: courseData,
    assignments: assignmentsData,
    quizzes: quizzesData,
    sessions: sessionsData,
    students: studentsData
  };
};
