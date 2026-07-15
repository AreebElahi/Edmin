import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const offeringId = 1;
  const studentId = 1;

  const a1 = await prisma.assessment.create({
    data: {
      offeringid: offeringId,
      name: 'Assignment 1',
      type: 'ASSIGNMENT',
      totalmarks: 100,
      weight: 33.33,
      status: 'PUBLISHED',
      createdby: 1,
    }
  });

  const a2 = await prisma.assessment.create({
    data: {
      offeringid: offeringId,
      name: 'Assignment 2',
      type: 'ASSIGNMENT',
      totalmarks: 100,
      weight: 33.33,
      status: 'PUBLISHED',
      createdby: 1,
    }
  });

  const a3 = await prisma.assessment.create({
    data: {
      offeringid: offeringId,
      name: 'Assignment 3',
      type: 'ASSIGNMENT',
      totalmarks: 100,
      weight: 33.34,
      status: 'PUBLISHED',
      createdby: 1,
    }
  });

  await prisma.assessmentresult.create({ data: { assessmentid: a1.assessmentid, studentid: studentId, obtainedmarks: 100 } });
  await prisma.assessmentresult.create({ data: { assessmentid: a2.assessmentid, studentid: studentId, obtainedmarks: 10 } });
  await prisma.assessmentresult.create({ data: { assessmentid: a3.assessmentid, studentid: studentId, obtainedmarks: 100 } });

  console.log('Seeded assessments and results.');
}
main().catch(console.error).finally(() => prisma.$disconnect());
