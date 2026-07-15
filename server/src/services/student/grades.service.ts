import { findStudentIdOnly } from '../../models/student/profile.model.js';
import { findEnrollmentsWithGrades } from '../../models/student/grades.model.js';
import { AppError } from '../../utils/AppError.js';

const getStudentId = async (userId: number): Promise<number> => {
  const student = await findStudentIdOnly(userId);
  if (!student) {
    throw new AppError(404, 'Student profile not found');
  }
  return student.studentid;
};

export const getGrades = async (userId: number) => {
  const enrollments = await findEnrollmentsWithGrades(userId);

  let totalCredits = 0;
  let weightedGradePoints = 0;

  // Calculate dynamically if not finalized
  const grades = await Promise.all(enrollments.map(async (e) => {
    const credits = e.courseoffering.course.credits ?? 3;
    let gp = e.gradepoints ?? 0.0;
    let grade = e.grade ?? 'N/A';
    let percentage = e.percentage;

    if (e.status !== 'COMPLETED' || grade === 'N/A') {
      try {
        const { calculateCoursePercentage } = await import('../assessment/grading.service.js');
        const { calculateLetterGrade } = await import('../assessment/gradeBoundary.service.js');
        
        // Wait, studentId vs userId!
        // The getGrades handler passes userId.
        // We need to resolve studentId.
        const studentId = await getStudentId(userId);
        const calculatedPercentage = await calculateCoursePercentage(studentId, e.courseofferingid);
        const { letterGrade, gradePoints } = await calculateLetterGrade(calculatedPercentage);
        if (calculatedPercentage > 0) {
          percentage = calculatedPercentage;
          grade = letterGrade;
          gp = gradePoints;
        }
      } catch (err) {
        console.error(`Dynamic grade calculation failed for user ${userId}, courseOfferingId ${e.courseofferingid}:`, err);
        // Fallback to existing if dynamic calculation fails
      }
    }

    // Only count towards GPA if a grade has been assigned
    if (grade && grade !== 'N/A') {
      totalCredits += credits;
      weightedGradePoints += gp * credits;
    }

    return {
      enrollmentId: e.courseenrollmentid,
      courseOfferingId: e.courseofferingid,
      course: {
        code: e.courseoffering.course.code,
        name: e.courseoffering.course.name,
        credits,
      },
      semester: e.courseoffering.semester.name,
      grade,
      gradepoints: gp,
      percentage,
      status: e.status,
    };
  }));

  const gpa = totalCredits > 0 ? weightedGradePoints / totalCredits : 0.0;

  return {
    gpa: Math.round(gpa * 100) / 100,
    totalCredits,
    grades,
  };
};
