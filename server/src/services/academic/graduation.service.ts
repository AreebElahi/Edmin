import prisma from '../../config/prisma.js';
import { recalculateDegreeAudit } from './degreeAudit.service.js';
import { getAcademicPolicy } from './policy.service.js';
import { checkFinancialClearance } from '../finance/financialClearance.service.js';

export const checkGraduationEligibility = async (studentId: number) => {
  const { audit } = await recalculateDegreeAudit(studentId);
  
  const record = await prisma.semesterrecord.findFirst({
    where: { studentid: studentId },
    orderBy: { updatedat: 'desc' },
    include: { student: true }
  });

  if (!record) {
    return {
      eligible: false,
      missingCredits: audit.requiredcredits,
      missingCourses: [],
      reason: 'No academic records found'
    };
  }

  const policy = await getAcademicPolicy(record.student.programid);
  const MIN_CGPA = policy.min_cgpa_graduation;

  let eligible = true;
  const reasons = [];

  if (audit.remainingcredits > 0) {
    eligible = false;
    reasons.push(`Missing ${audit.remainingcredits} credits.`);
  }

  if (record.cgpa < MIN_CGPA) {
    eligible = false;
    reasons.push(`CGPA ${record.cgpa} is below minimum required ${MIN_CGPA}.`);
  }

  if (record.standing !== 'GOOD_STANDING') {
    eligible = false;
    reasons.push(`Academic standing must be GOOD_STANDING. Currently: ${record.standing}`);
  }

  // To check if they failed core courses, we'd look into degreeAudit logic or specific checks.
  // Assuming the degreeAudit eligible flag handles the major heavy lifting now:
  if (!audit.eligible) {
    eligible = false;
    reasons.push(`Degree audit requirements not fully met.`);
  }

  const isCleared = await checkFinancialClearance(studentId);
  if (!isCleared) {
    eligible = false;
    reasons.push(`Outstanding financial dues. Must be CLEARED to graduate.`);
  }

  return {
    eligible,
    missingCredits: audit.remainingcredits,
    missingCourses: [],
    reasons
  };
};
