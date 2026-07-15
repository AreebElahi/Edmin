import prisma from '../../config/prisma.js';

export const getCourses = async (userId: number) => {
  const faculty = await prisma.faculty.findFirst({
    where: { userid: userId, isactive: true },
  });

  if (!faculty) throw new Error('Faculty profile not found');

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
