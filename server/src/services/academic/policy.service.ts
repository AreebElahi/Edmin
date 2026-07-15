import prisma from '../../config/prisma.js';

// Simple in-memory cache for policies to avoid DB hits on every GPA calc
let policyCache: Record<string, any> = {};

export const getAcademicPolicy = async (programId?: number | null) => {
  const cacheKey = programId ? programId.toString() : 'default';
  
  if (policyCache[cacheKey]) {
    return policyCache[cacheKey];
  }

  let policy;

  if (programId) {
    policy = await prisma.academicpolicy.findFirst({
      where: { programid: programId, isactive: true },
      orderBy: { version: 'desc' }
    });
  }

  // Fallback to university-wide default if no program-specific policy exists
  if (!policy) {
    policy = await prisma.academicpolicy.findFirst({
      where: { programid: null, isactive: true },
      orderBy: { version: 'desc' }
    });
  }

  // If absolutely no policy is configured, return hardcoded standard defaults
  if (!policy) {
    policy = {
      min_cgpa_graduation: 2.0,
      warning_cgpa_threshold: 2.0,
      probation_cgpa_threshold: 1.7,
      max_probation_semesters: 2,
      min_earned_credits: 120
    };
  }

  policyCache[cacheKey] = policy;
  return policy;
};

export const clearPolicyCache = () => {
  policyCache = {};
};
