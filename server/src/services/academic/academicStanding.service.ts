import { academic_standing } from '@prisma/client';
import { getAcademicPolicy } from './policy.service.js';

export const determineAcademicStanding = async (cgpa: number, programId?: number | null): Promise<academic_standing> => {
  const policy = await getAcademicPolicy(programId);

  if (cgpa >= policy.min_cgpa_graduation) return 'GOOD_STANDING';
  if (cgpa >= policy.warning_cgpa_threshold) return 'WARNING';
  if (cgpa >= policy.probation_cgpa_threshold) return 'PROBATION';
  return 'SUSPENDED'; // Could also add rules for dismissal based on max_probation_semesters
};

// Hardcoded for now, but could be moved to policy as well
export const determineHonors = (cgpa: number) => {
  if (cgpa >= 3.9) return 'SUMMA_CUM_LAUDE';
  if (cgpa >= 3.7) return 'MAGNA_CUM_LAUDE';
  if (cgpa >= 3.5) return 'CUM_LAUDE';
  return 'NONE';
};
