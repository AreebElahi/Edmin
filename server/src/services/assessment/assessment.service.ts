import prisma from '../../config/prisma.js';
import { assessment_type, assessment_status } from '@prisma/client';

export const validateAssessmentWeights = async (offeringId: number, newWeight: number, excludeAssessmentId?: number) => {
  if (newWeight <= 0) {
    throw new Error('Weight must be positive');
  }

  const existingAssessments = await prisma.assessment.findMany({
    where: { offeringid: offeringId }
  });

  let totalWeight = newWeight;
  let finalCount = 0;

  for (const assessment of existingAssessments) {
    if (excludeAssessmentId && assessment.assessmentid === excludeAssessmentId) {
      continue;
    }
    totalWeight += assessment.weight;
    if (assessment.type === 'FINAL') {
      finalCount++;
    }
  }

  if (totalWeight > 100) {
    throw new Error(`Total weight exceeds 100%. Current total would be ${totalWeight}%`);
  }

  return { totalWeight, finalCount };
};

export const createAssessment = async (data: {
  offeringid: number;
  name: string;
  type: assessment_type;
  totalmarks: number;
  weight: number;
  dueDate?: Date;
  createdby?: number;
}) => {
  const { finalCount } = await validateAssessmentWeights(data.offeringid, data.weight);
  
  if (data.type === 'FINAL' && finalCount >= 1) {
    throw new Error('Cannot have more than one FINAL assessment for an offering.');
  }

  return await prisma.assessment.create({
    data: {
      ...data,
      status: 'DRAFT'
    }
  });
};

export const updateAssessment = async (assessmentId: number, data: any) => {
  const existing = await prisma.assessment.findUnique({ where: { assessmentid: assessmentId } });
  if (!existing) throw new Error('Assessment not found');
  if (existing.status === 'LOCKED') throw new Error('Cannot update a LOCKED assessment');

  if (data.weight) {
    const { finalCount } = await validateAssessmentWeights(existing.offeringid, data.weight, assessmentId);
    if ((data.type || existing.type) === 'FINAL' && finalCount >= 1 && existing.type !== 'FINAL') {
        throw new Error('Cannot have more than one FINAL assessment for an offering.');
    }
  }

  return await prisma.assessment.update({
    where: { assessmentid: assessmentId },
    data
  });
};
