import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const publishedAssessments = await prisma.assessment.findMany({
    where: { 
      offeringid: 1,
      status: 'PUBLISHED'
    }
  });
  console.log('Assessments length:', publishedAssessments.length);
  
  if (publishedAssessments.length > 0) {
    const result = await prisma.assessmentresult.findUnique({
      where: {
        assessmentid_studentid: {
          assessmentid: publishedAssessments[0].assessmentid,
          studentid: 1
        }
      }
    });
    console.log('Result for student 1:', result);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
