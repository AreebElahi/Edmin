import prisma from '../../config/prisma.js';

export const getGradeScales = async () => {
  return await prisma.gradeboundary.findMany({
    orderBy: { minpercentage: 'desc' }
  });
};

export const calculateLetterGrade = async (percentage: number) => {
  const boundaries = await getGradeScales();
  for (const b of boundaries) {
    const min = Number(b.minpercentage);
    const max = Number(b.maxpercentage);
    if (percentage >= min && percentage <= max) {
      return { letterGrade: b.grade, gradePoints: Number(b.gradepoints) };
    }
  }
  return { letterGrade: 'F', gradePoints: 0 };
};

export const createGradeBoundary = async (data: { grade: string; minpercentage: number; maxpercentage: number; gradepoints: number }) => {
  return await prisma.gradeboundary.create({ data });
};
