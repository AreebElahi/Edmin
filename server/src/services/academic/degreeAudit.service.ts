import prisma from '../../config/prisma.js';
import { processRepeats } from './repeatPolicy.service.js';
import { getAcademicPolicy } from './policy.service.js';

export const recalculateDegreeAudit = async (studentId: number) => {
  const student = await prisma.student.findUnique({
    where: { studentid: studentId },
    include: { program: { include: { curriculum: { include: { categories: true } } } } }
  });

  if (!student || !student.program) throw new Error('Student or Program not found');

  const curriculum = student.program.curriculum.find(c => c.isactive);
  if (!curriculum) throw new Error('No active curriculum found for program');

  const policy = await getAcademicPolicy(student.programid);

  // 1. Fetch all required courses with category mapping
  const requiredCourseList = await prisma.curriculumcourse.findMany({
    where: { curriculumid: curriculum.curriculumid },
    include: { course: true }
  });

  // 2. Process Student Enrollments (apply repeat policy)
  const enrollments = await prisma.courseenrollment.findMany({
    where: { studentid: studentId, status: 'COMPLETED' },
    include: { courseoffering: { include: { course: true } } }
  });

  const { activeEnrollments } = processRepeats(enrollments);

  // 3. Accumulate earned credits per category ID
  // Initialize accumulator with 0 for all existing categories
  const categoryProgress: Record<number, number> = {};
  for (const cat of curriculum.categories) {
    categoryProgress[cat.categoryid] = 0;
  }
  
  let totalEarnedCredits = 0;
  let totalRequiredCredits = curriculum.categories.reduce((acc, cat) => acc + cat.requiredcredits, 0);
  
  // Fallback: If no categories exist, use the old total credit calculation
  if (curriculum.categories.length === 0) {
     totalRequiredCredits = requiredCourseList.reduce((acc, rc) => acc + rc.course.credits, 0) || policy.min_earned_credits;
  }

  for (const enrollment of activeEnrollments) {
    if (enrollment.gradepoints && enrollment.gradepoints > 0) {
      const credits = enrollment.courseoffering.course.credits;
      totalEarnedCredits += credits;

      // Find if this course maps to a specific category
      const curCourse = requiredCourseList.find(rc => rc.courseid === enrollment.courseoffering.courseid);
      if (curCourse && curCourse.categoryid) {
        categoryProgress[curCourse.categoryid] += credits;
      }
    }
  }

  // 4. Update studentdegreeprogress atomically (Idempotent)
  await prisma.$transaction(async (tx) => {
    for (const cat of curriculum.categories) {
      const earned = categoryProgress[cat.categoryid] || 0;
      const isComplete = earned >= cat.requiredcredits;

      await tx.studentdegreeprogress.upsert({
        where: {
          studentid_categoryid: { studentid: studentId, categoryid: cat.categoryid }
        },
        update: {
          earnedcredits: earned,
          iscomplete: isComplete
        },
        create: {
          studentid: studentId,
          categoryid: cat.categoryid,
          earnedcredits: earned,
          iscomplete: isComplete
        }
      });
    }
  });

  // 5. Evaluate overall Graduation Eligibility
  const cgpa = await calculateCurrentCGPA(studentId); // Assuming we have this, or we rely on semesterrecord
  const hasMetCredits = totalEarnedCredits >= totalRequiredCredits && totalEarnedCredits >= policy.min_earned_credits;
  const hasMetCGPA = cgpa >= policy.min_cgpa_graduation;
  
  // Check if all granular categories are fulfilled
  let allCategoriesMet = true;
  for (const cat of curriculum.categories) {
    if ((categoryProgress[cat.categoryid] || 0) < cat.requiredcredits) {
      allCategoriesMet = false;
      break;
    }
  }

  // If there are no categories, default to just total credits.
  const isEligible = curriculum.categories.length > 0 
                     ? (allCategoriesMet && hasMetCGPA && hasMetCredits) 
                     : (hasMetCGPA && hasMetCredits);

  const remainingCredits = Math.max(0, totalRequiredCredits - totalEarnedCredits);

  // 6. Update cached degreeaudit table
  const audit = await prisma.degreeaudit.upsert({
    where: { studentid: studentId },
    update: {
      requiredcredits: totalRequiredCredits,
      earnedcredits: totalEarnedCredits,
      remainingcredits: remainingCredits,
      eligible: isEligible,
      status: isEligible ? 'ELIGIBLE' : 'NOT_ELIGIBLE'
    },
    create: {
      studentid: studentId,
      requiredcredits: totalRequiredCredits,
      earnedcredits: totalEarnedCredits,
      remainingcredits: remainingCredits,
      eligible: isEligible,
      status: isEligible ? 'ELIGIBLE' : 'NOT_ELIGIBLE'
    }
  });

  return {
    audit,
    categoryProgress
  };
};

// Helper for CGPA retrieval
const calculateCurrentCGPA = async (studentId: number): Promise<number> => {
  const latestRecord = await prisma.semesterrecord.findFirst({
    where: { studentid: studentId },
    orderBy: { semesterrecordid: 'desc' }
  });
  return latestRecord?.cgpa || 0;
};
