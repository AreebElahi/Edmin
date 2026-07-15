import prisma from '../config/prisma.js';
import { eventBus, Events } from '../events/eventBus.js';

export const createCourse = async (code: string, name: string) => {
  return await prisma.course.create({
    data: {
      code,
      name,
      isactive: true,
      createdat: new Date(),
      updatedat: new Date(),
    },
  });
};

export const createCourseOffering = async (courseId: number, semesterId: number, departmentId: number, facultyId: number) => {
  return await prisma.courseoffering.create({
    data: {
      courseid: courseId,
      semesterid: semesterId,
      departmentid: departmentId,
      facultyid: facultyId,
      instructorid: facultyId, // Assuming instructor is same as faculty for now
      isactive: true,
      createdat: new Date(),
      updatedat: new Date(),
    },
  });
};

export const enrollStudent = async (studentId: number, courseOfferingId: number) => {
  // Check if already enrolled
  const existing = await prisma.courseenrollment.findFirst({
    where: { studentid: studentId, courseofferingid: courseOfferingId }
  });

  if (existing) {
    throw new Error('Student is already enrolled in this course offering');
  }

  const enrollment = await prisma.courseenrollment.create({
    data: {
      studentid: studentId,
      courseofferingid: courseOfferingId,
      isactive: true,
      createdat: new Date(),
      updatedat: new Date(),
    },
    include: {
      courseoffering: {
        include: { course: true }
      },
      student: true
    }
  });

  // Emit event for notification
  eventBus.emit(Events.USER_ENROLLED, {
    userId: enrollment.student.userid,
    courseName: enrollment.courseoffering.course.name,
  });

  return enrollment;
};

export const getAllCourses = async () => {
  return await prisma.course.findMany({ where: { isactive: true } });
};

export const getAllCourseOfferings = async () => {
  const offerings = await prisma.courseoffering.findMany({
    where: { isactive: true },
    include: {
      course: true,
      semester: true,
      department: true,
      faculty: {
        include: {
          user: true
        }
      },
      _count: {
        select: {
          courseenrollment: {
            where: { isactive: true }
          }
        }
      }
    }
  });

  return offerings.map(o => ({
    courseofferingid: o.courseofferingid,
    courseid: o.courseid,
    semesterid: o.semesterid,
    departmentid: o.departmentid,
    instructorid: o.instructorid,
    sectionid: o.sectionid,
    capacity: o.capacity,
    status: o.status,
    course: o.course,
    semester: o.semester,
    department: o.department,
    faculty: o.faculty,
    enrollmentsCount: o._count.courseenrollment
  }));
};
