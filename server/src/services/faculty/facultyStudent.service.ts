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
    const attendancePercentage = studentAttendance.length > 0 
      ? Math.round((studentAttendance.filter(a => a.status === 'PRESENT').length / studentAttendance.length) * 100) 
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

  const sessions = await prisma.classsession.findMany({
    where: {
      courseofferingid: { in: offeringIds },
      isactive: true
    },
    include: {
      _count: { select: { attendance: true } }
    },
    orderBy: { sessiondate: 'desc' },
    take: 50
  });

  return sessions.map(s => ({
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
  }));
};

export const markAttendance = async (userId: number, sessionId: string, records: { studentId: number, status: string }[]) => {
  const faculty = await prisma.faculty.findFirst({ where: { userid: userId, isactive: true } });
  if (!faculty) throw new Error('Faculty profile not found');

  const session = await prisma.classsession.findFirst({
    where: { classsessionid: parseInt(sessionId) }
  });

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
