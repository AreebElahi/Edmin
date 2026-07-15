import prisma from '../../config/prisma.js';

export const checkPrerequisites = async (studentId: number, courseId: number): Promise<{ eligible: boolean, reason?: string }> => {
  const prerequisites = await prisma.courseprerequisite.findMany({
    where: { courseid: courseId }
  });

  if (prerequisites.length === 0) return { eligible: true };

  // Get student's completed courses
  const completedEnrollments = await prisma.courseenrollment.findMany({
    where: {
      studentid: studentId,
      status: 'COMPLETED'
    },
    include: {
      courseoffering: true
    }
  });

  const completedCourseIds = new Set(completedEnrollments.map(e => e.courseoffering.courseid));

  for (const prereq of prerequisites) {
    if (!completedCourseIds.has(prereq.prerequisitecourseid)) {
      const prereqCourse = await prisma.course.findUnique({ where: { courseid: prereq.prerequisitecourseid } });
      return { eligible: false, reason: `Missing prerequisite: ${prereqCourse?.code}` };
    }
  }

  return { eligible: true };
};

export const checkMaximumCreditHours = async (studentId: number, semesterId: number, maxCredits: number = 18): Promise<boolean> => {
  const enrollments = await prisma.courseenrollment.findMany({
    where: {
      studentid: studentId,
      status: 'ENROLLED',
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

  const currentCredits = enrollments.reduce((sum, e) => sum + e.courseoffering.course.credits, 0);
  return currentCredits <= maxCredits;
};
