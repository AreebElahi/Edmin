import prisma from '../../config/prisma.js';

export const createCurriculum = async (programId: number, name: string, version?: string) => {
  return await prisma.curriculum.create({
    data: {
      programid: programId,
      name,
      version,
      isactive: true,
    }
  });
};

export const addCourseToCurriculum = async (curriculumId: number, courseId: number, semesterOffset: number, isCore: boolean = true) => {
  return await prisma.curriculumcourse.create({
    data: {
      curriculumid: curriculumId,
      courseid: courseId,
      semesteroffset: semesterOffset,
      iscore: isCore
    }
  });
};

export const getCurriculumDetails = async (curriculumId: number) => {
  return await prisma.curriculum.findUnique({
    where: { curriculumid: curriculumId },
    include: {
      courses: {
        include: {
          course: true
        },
        orderBy: { semesteroffset: 'asc' }
      }
    }
  });
};
