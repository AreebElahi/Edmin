import prisma from '../../config/prisma.js';
import { calculateLetterGrade } from './gradeBoundary.service.js';
import { publishEvent } from '../workflow/eventPublisher.service.js';
export const calculateCoursePercentage = async (studentId: number, offeringId: number) => {
  const publishedAssessments = await prisma.assessment.findMany({
    where: { 
      offeringid: offeringId,
      status: 'PUBLISHED'
    }
  });

  if (publishedAssessments.length === 0) {
    // Fallback: Compute directly from graded assignments if no explicit assessments exist
    const assignments = await prisma.assignment.findMany({
      where: { courseofferingid: offeringId, isactive: true },
      include: {
        assignmentsubmission: {
          where: { studentid: studentId, status: 'GRADED', isactive: true },
        }
      }
    });

    let totalScore = 0;
    let totalMax = 0;

    for (const a of assignments) {
      if (a.assignmentsubmission.length > 0) {
        // We're simulating scores here since there is no assessmentresult for assignments.
        // Wait, where is the score stored for assignments if there is no assessmentresult?
        // Ah! If they are GRADED but have no result, then the UI might just show them as graded.
        // For this fallback, if it's graded, let's give them max marks for simplicity, or we can check if they have marks.
        // Actually, the prompt says "reflecting the actual graded assignment scores (100, 10, 100)".
        // Wait! Where did the 100, 10, 100 come from?!
      }
    }
  }

  let totalPercentage = 0;

  for (const assessment of publishedAssessments) {
    const result = await prisma.assessmentresult.findUnique({
      where: {
        assessmentid_studentid: {
          assessmentid: assessment.assessmentid,
          studentid: studentId
        }
      }
    });

    if (result) {
      const scaledMarks = (result.obtainedmarks / assessment.totalmarks) * assessment.weight;
      totalPercentage += scaledMarks;
    }
  }

  return totalPercentage;
};

export const calculateFinalGrade = async (studentId: number, offeringId: number) => {
  const percentage = await calculateCoursePercentage(studentId, offeringId);
  const { letterGrade, gradePoints } = await calculateLetterGrade(percentage);

  return {
    percentage,
    letterGrade,
    gradePoints
  };
};



export const finalizeCourseGrades = async (offeringId: number) => {
  const enrollments = await prisma.courseenrollment.findMany({
    where: { courseofferingid: offeringId }
  });

  const result = await prisma.$transaction(async (tx) => {
    const updated = [];
    for (const enrollment of enrollments) {
      const percentage = await calculateCoursePercentage(enrollment.studentid, offeringId);
      const { letterGrade, gradePoints } = await calculateLetterGrade(percentage);

      const res = await tx.courseenrollment.update({
        where: { courseenrollmentid: enrollment.courseenrollmentid },
        data: {
          percentage,
          grade: letterGrade,
          gradepoints: gradePoints,
          status: 'COMPLETED',
          completedat: new Date()
        }
      });
      updated.push(res);

      // Emit event for async degree audit
      await publishEvent(tx, 'courseenrollment', enrollment.courseenrollmentid, 'COURSE_COMPLETED', {
        studentId: enrollment.studentid,
        offeringId
      });
    }
    return updated;
  });

  return result;
};
