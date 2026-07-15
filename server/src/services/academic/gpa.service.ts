import prisma from '../../config/prisma.js';

export const calculateSemesterGPA = async (studentId: number, semesterId: number) => {
  const enrollments = await prisma.courseenrollment.findMany({
    where: {
      studentid: studentId,
      status: 'COMPLETED',
      courseoffering: {
        semesterid: semesterId
      }
    },
    include: {
      courseoffering: {
        include: {
          course: true
        }
      }
    }
  });

  let totalPoints = 0;
  let totalCredits = 0;
  let earnedCredits = 0;

  for (const enrollment of enrollments) {
    const credits = enrollment.courseoffering.course.credits;
    totalCredits += credits;
    if (enrollment.gradepoints !== null) {
      totalPoints += enrollment.gradepoints * credits;
      if (enrollment.gradepoints > 0) {
        earnedCredits += credits;
      }
    }
  }

  const semesterGpa = totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;
  
  return { semesterGpa, totalCredits, earnedCredits };
};

export const calculateCGPA = async (studentId: number) => {
  const enrollments = await prisma.courseenrollment.findMany({
    where: {
      studentid: studentId,
      status: 'COMPLETED'
    },
    include: {
      courseoffering: {
        include: {
          course: true
        }
      }
    }
  });

  let totalPoints = 0;
  let totalCredits = 0;

  for (const enrollment of enrollments) {
    const credits = enrollment.courseoffering.course.credits;
    totalCredits += credits;
    if (enrollment.gradepoints !== null) {
      totalPoints += enrollment.gradepoints * credits;
    }
  }

  const cgpa = totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;
  return cgpa;
};
