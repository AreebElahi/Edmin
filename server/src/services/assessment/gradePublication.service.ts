import prisma from '../../config/prisma.js';
import { publishEvent } from '../workflow/eventPublisher.service.js';

export const publishGrades = async (assessmentId: number, publishedByUserId: number) => {
  return await prisma.$transaction(async (tx) => {
    const assessment = await tx.assessment.update({
      where: { assessmentid: assessmentId },
      data: {
        status: 'PUBLISHED',
        publishedby: publishedByUserId,
        publishedat: new Date()
      },
      include: {
        courseoffering: { include: { course: true } }
      }
    });

    // Find students who took this assessment (we look at assessmentresult or courseenrollment)
    const results = await tx.assessmentresult.findMany({
      where: { assessmentid: assessmentId },
      select: { studentid: true }
    });

    for (const res of results) {
      await publishEvent(
        tx,
        'ASSESSMENT',
        assessmentId,
        'GRADES_PUBLISHED',
        { 
          assessmentId, 
          studentId: res.studentid, 
          courseName: assessment.courseoffering.course.name 
        }
      );
    }

    return assessment;
  });
};

export const lockGrades = async (assessmentId: number) => {
  return await prisma.assessment.update({
    where: { assessmentid: assessmentId },
    data: {
      status: 'LOCKED',
      lockedat: new Date()
    }
  });
};

export const reopenGrades = async (assessmentId: number, updatedByUserId: number) => {
  return await prisma.assessment.update({
    where: { assessmentid: assessmentId },
    data: {
      status: 'DRAFT',
      updatedby: updatedByUserId,
      lockedat: null,
      publishedat: null
    }
  });
};
