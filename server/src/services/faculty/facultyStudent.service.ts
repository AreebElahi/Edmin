import prisma from '../../config/prisma.js';
import { createClassSession } from '../attendance/attendance.service.js';

export const getStudents = async (userId: number) => {
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
    select: { courseofferingid: true },
  });

  const offeringIds = offerings.map(o => o.courseofferingid);

  if (offeringIds.length === 0) return [];

  const enrollments = await prisma.courseenrollment.findMany({
    where: {
      courseofferingid: { in: offeringIds },
      isactive: true,
      student: { isactive: true },
    },
    include: {
      student: {
        include: {
          attendance: { 
            where: { classsession: { courseofferingid: { in: offeringIds } } },
            include: { classsession: true }
          }
        }
      },
      courseoffering: {
        include: { course: true, semester: true },
      },
    },
  });

  return enrollments.map((e) => {
      const studentAttendance = e.student.attendance?.filter(a => a.classsession?.courseofferingid === e.courseofferingid) || [];
      const presentCount = studentAttendance.filter(a => a.status === 'PRESENT').length;
      const attendancePercentage = studentAttendance.length > 0 
        ? Math.round((presentCount / studentAttendance.length) * 100) 
        : 0;
  
      return {
        id: `${e.courseenrollmentid}`,
        studentId: e.student.rollnumber,
        name: e.student.fullname,
        email: (e.student as any).email || `${e.student.rollnumber}@edmin.edu`,
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
};

export const updateStudentGrade = async (userId: number, enrollmentIdStr: string, grade: string) => {
  const validGrades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F', 'N/A'];
  if (!validGrades.includes(grade)) throw new Error('Invalid grade value');

  const faculty = await prisma.faculty.findFirst({
    where: { userid: userId, isactive: true },
  });

  if (!faculty) throw new Error('Faculty profile not found');

  const enrollmentId = parseInt(enrollmentIdStr);
  const enrollment = await prisma.courseenrollment.findFirst({
    where: {
      courseenrollmentid: enrollmentId,
      isactive: true,
      courseoffering: {
        OR: [
          { facultyid: faculty.facultyid },
          { instructorid: faculty.facultyid },
        ],
        isactive: true,
      }
    }
  });

  if (!enrollment) throw new Error('Not authorized to modify this enrollment or it does not exist');

  return await prisma.$transaction(async (tx) => {
    const updatedEnrollment = await tx.courseenrollment.update({
      where: { courseenrollmentid: enrollmentId },
      data: { grade },
    });

    await tx.auditlog.create({
      data: {
        userid: userId,
        action: 'UPDATE_GRADE',
        tablename: 'courseenrollment',
        recordid: enrollment.courseenrollmentid,
        oldvalues: { grade: enrollment.grade },
        newvalues: { grade },
      }
    });

    return updatedEnrollment;
  });
};

export const getAttendanceSessions = async (userId: number) => {
  const faculty = await prisma.faculty.findFirst({
    where: { userid: userId, isactive: true }
  });

  if (!faculty) throw new Error('Faculty profile not found');

  const offerings = await prisma.courseoffering.findMany({
    where: {
      OR: [{ facultyid: faculty.facultyid }, { instructorid: faculty.facultyid }],
      isactive: true
    },
    select: { 
      courseofferingid: true, 
      course: { select: { code: true, name: true } },
      _count: { select: { courseenrollment: { where: { isactive: true } } } }
    }
  });

  const offeringIds = offerings.map(o => o.courseofferingid);
  const offeringMap = new Map(offerings.map(o => [o.courseofferingid, o.course]));

  // Fetch actual sessions and timetable slots concurrently
  const [actualSessions, timetables] = await Promise.all([
    prisma.classsession.findMany({
      where: {
        courseofferingid: { in: offeringIds },
        isactive: true
      },
      include: {
        _count: { select: { attendance: { where: { status: 'PRESENT' } } } }
      }
    }),
    prisma.timetable.findMany({
      where: { courseofferingid: { in: offeringIds }, isactive: true }
    })
  ]);

  const dayMap: Record<string, number> = { 'SUN': 0, 'MON': 1, 'TUE': 2, 'WED': 3, 'THU': 4, 'FRI': 5, 'SAT': 6 };
  
  const generatedSessions: any[] = [];
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const startDate = new Date(today);
  startDate.setHours(0, 0, 0, 0); // Only generate virtual sessions for today

  // Map actual sessions by date and offering
  const actualSessionMap = new Map();
  actualSessions.forEach(s => {
    const key = `${s.courseofferingid}_${new Date(s.sessiondate).toLocaleDateString('en-CA')}`;
    actualSessionMap.set(key, s);
  });

  // Generate sessions from timetable
  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    const dateStr = d.toLocaleDateString('en-CA');

    for (const tt of timetables) {
      if (dayMap[tt.dayofweek] === dayOfWeek) {
        const key = `${tt.courseofferingid}_${dateStr}`;
        const actualSession = actualSessionMap.get(key);
        
        const totalStudents = offerings.find(o => o.courseofferingid === tt.courseofferingid)?._count.courseenrollment || 0;

        if (actualSession) {
          generatedSessions.push({
            id: `${actualSession.classsessionid}`,
            classsessionid: actualSession.classsessionid,
            courseCode: offeringMap.get(tt.courseofferingid)?.code || 'Unknown',
            courseName: offeringMap.get(tt.courseofferingid)?.name || 'Unknown Course',
            sessionDate: actualSession.sessiondate,
            startTime: actualSession.starttime || tt.starttime,
            endTime: actualSession.endtime || tt.endtime,
            topic: actualSession.topic || 'Regular Session',
            status: actualSession.status,
            attendanceCount: actualSession._count.attendance,
            totalStudents
          });
          actualSessionMap.delete(key); // Mark as processed
        } else {
          // Create virtual session
          generatedSessions.push({
            id: `virtual_${tt.courseofferingid}_${dateStr}`,
            classsessionid: null, // Virtual
            courseofferingid: tt.courseofferingid, // Pass offering ID for virtual creation
            courseCode: offeringMap.get(tt.courseofferingid)?.code || 'Unknown',
            courseName: offeringMap.get(tt.courseofferingid)?.name || 'Unknown Course',
            sessionDate: new Date(d),
            startTime: tt.starttime,
            endTime: tt.endtime,
            topic: 'Regular Session',
            status: 'SCHEDULED',
            attendanceCount: 0,
            totalStudents
          });
        }
      }
    }
  }

  // Add any remaining actual sessions that didn't fall on a timetable slot (e.g. ad-hoc sessions)
  actualSessionMap.forEach((s) => {
    generatedSessions.push({
      id: `${s.classsessionid}`,
      classsessionid: s.classsessionid,
      courseCode: offeringMap.get(s.courseofferingid)?.code || 'Unknown',
      courseName: offeringMap.get(s.courseofferingid)?.name || 'Unknown Course',
      sessionDate: s.sessiondate,
      startTime: s.starttime,
      endTime: s.endtime,
      topic: s.topic || 'Regular Session',
      status: s.status,
      attendanceCount: s._count.attendance,
      totalStudents: offerings.find(o => o.courseofferingid === s.courseofferingid)?._count.courseenrollment || 0
    });
  });

  // Sort descending by date
  generatedSessions.sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());

  return generatedSessions.slice(0, 50);
};

export const getAttendanceSessionRoster = async (userId: number, sessionId: string) => {
  const faculty = await prisma.faculty.findFirst({ where: { userid: userId, isactive: true } });
  if (!faculty) throw new Error('Faculty profile not found');

  let courseOfferingId: number;
  let sessionDate: string;
  let topic = 'Regular Session';
  let existingAttendances: any[] = [];

  const isVirtual = sessionId.startsWith('virtual_');
  
  if (isVirtual) {
    const parts = sessionId.split('_');
    courseOfferingId = parseInt(parts[1]);
    sessionDate = parts[2];
  } else {
    const session = await prisma.classsession.findFirst({
      where: { classsessionid: parseInt(sessionId) },
      include: { attendance: true }
    });
    if (!session) throw new Error('Session not found');
    courseOfferingId = session.courseofferingid;
    sessionDate = new Date(session.sessiondate).toISOString();
    topic = session.topic || 'Regular Session';
    existingAttendances = session.attendance;
  }

  const offering = await prisma.courseoffering.findFirst({
    where: {
      courseofferingid: courseOfferingId,
      OR: [{ facultyid: faculty.facultyid }, { instructorid: faculty.facultyid }]
    },
    include: {
      course: true,
      courseenrollment: {
        where: { isactive: true, student: { isactive: true } },
        include: { student: true }
      }
    }
  });

  if (!offering) throw new Error('Unauthorized or offering not found');

  const attendanceMap = new Map(existingAttendances.map(a => [a.studentid, a.status]));

  const roster = offering.courseenrollment.map(e => ({
    id: e.student.studentid,
    studentId: e.student.studentid,
    rollNo: e.student.rollnumber,
    rollNumber: e.student.rollnumber,
    name: e.student.fullname,
    email: (e.student as any).email || `${e.student.rollnumber}@edmin.edu`,
    avatar: e.student.avatar,
    status: (attendanceMap.get(e.student.studentid) || 'PENDING').toLowerCase()
  }));

  return {
    courseName: offering.course.name,
    courseCode: offering.course.code,
    sessionDate,
    topic,
    roster
  };
};

export const markAttendance = async (userId: number, sessionId: string, records: { studentId: number, status: string }[]) => {
  const faculty = await prisma.faculty.findFirst({ where: { userid: userId, isactive: true } });
  if (!faculty) throw new Error('Faculty profile not found');

  let session;

  if (sessionId.startsWith('virtual_')) {
    const parts = sessionId.split('_');
    const courseOfferingId = parseInt(parts[1]);
    const sessionDate = new Date(parts[2]);
    session = await createClassSession(courseOfferingId, sessionDate, undefined, undefined, 'Regular Session');
  } else {
    session = await prisma.classsession.findFirst({
      where: { classsessionid: parseInt(sessionId) }
    });
  }

  if (!session) throw new Error('Unauthorized or session not found');

  const offering = await prisma.courseoffering.findFirst({
    where: {
      courseofferingid: session.courseofferingid,
      OR: [{ facultyid: faculty.facultyid }, { instructorid: faculty.facultyid }]
    },
    include: { courseenrollment: true }
  });

  if (!offering) throw new Error('Unauthorized or session not found');

  const enrolledStudentIds = new Set(offering.courseenrollment.map((e: any) => e.studentid));

  for (const record of records) {
    if (!enrolledStudentIds.has(record.studentId)) {
      throw new Error(`Student ${record.studentId} is not enrolled in this course offering`);
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const record of records) {
        const existing = await tx.attendance.findFirst({
          where: {
            sessionid: session.classsessionid,
            studentid: record.studentId
          }
        });

        if (existing) {
          if (existing.status !== record.status) {
            await tx.attendance.update({
              where: { attendanceid: existing.attendanceid },
              data: { status: record.status as any }
            });
            
            await tx.attendanceauditlog.create({
              data: {
                attendanceid: existing.attendanceid,
                editedbyid: userId,
                studentid: record.studentId,
                oldstatus: existing.status || 'PENDING',
                newstatus: record.status
              }
            });
          }
        } else {
          await tx.attendance.create({
            data: {
              sessionid: session.classsessionid,
              studentid: record.studentId,
              status: record.status as any
            }
          });
        }
      }

      // Update session status to COMPLETED since attendance has been marked
      if (session.status !== 'COMPLETED') {
        await tx.classsession.update({
          where: { classsessionid: session.classsessionid },
          data: { status: 'COMPLETED' }
        });
      }
    });
    return { message: 'Attendance marked successfully' };
  } catch (err: any) {
    if (err.code === 'P2002') throw new Error('DUPLICATE_ATTENDANCE');
    throw err;
  }
};

export const createAttendanceSessionRecord = async (userId: number, courseOfferingId: string, sessionDate: string, startTime: string, endTime: string, topic: string) => {
  const faculty = await prisma.faculty.findFirst({
    where: { userid: userId, isactive: true },
  });

  if (!faculty) throw new Error('Faculty profile not found');

  const offering = await prisma.courseoffering.findFirst({
    where: {
      courseofferingid: parseInt(courseOfferingId),
      OR: [
        { facultyid: faculty.facultyid },
        { instructorid: faculty.facultyid }
      ]
    }
  });

  if (!offering) throw new Error('Unauthorized: Course offering not assigned to this faculty');

  return await createClassSession(
    offering.courseofferingid,
    new Date(sessionDate),
    startTime ? new Date(startTime) : undefined,
    endTime ? new Date(endTime) : undefined,
    topic
  );
};
