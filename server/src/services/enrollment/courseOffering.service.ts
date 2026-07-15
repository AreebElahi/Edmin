import prisma from '../../config/prisma.js';
import { Prisma } from '@prisma/client';

export const openCourseOffering = async (
  courseId: number,
  departmentId: number,
  semesterId: number,
  sectionId?: number,
  instructorId?: number,
  capacity: number = 50
) => {
  return await prisma.courseoffering.create({
    data: {
      courseid: courseId,
      departmentid: departmentId,
      semesterid: semesterId,
      sectionid: sectionId,
      instructorid: instructorId,
      capacity,
      status: 'ACTIVE',
      isactive: true
    }
  });
};

export const assignInstructorToOffering = async (offeringId: number, instructorId: number) => {
  return await prisma.courseoffering.update({
    where: { courseofferingid: offeringId },
    data: { instructorid: instructorId }
  });
};

export const getCourseOfferings = async (semesterId?: number, departmentId?: number) => {
  return await prisma.courseoffering.findMany({
    where: {
      ...(semesterId ? { semesterid: semesterId } : {}),
      ...(departmentId ? { departmentid: departmentId } : {}),
      isactive: true
    },
    include: {
      course: true,
      section: true,
      faculty: true
    }
  });
};
