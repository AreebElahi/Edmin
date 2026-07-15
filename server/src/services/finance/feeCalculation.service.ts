import prisma from '../../config/prisma.js';

export const calculateFeeForSemester = async (studentId: number, semesterId: number, enrolledCredits: number) => {
  const student = await prisma.student.findUnique({
    where: { studentid: studentId }
  });

  if (!student || !student.programid) {
    throw new Error('Student or Program not found');
  }

  // Find fee plan for this program (ideally matching the semester or a generic active one)
  const feePlan = await prisma.feeplan.findFirst({
    where: { 
      programid: student.programid,
      isactive: true
    },
    orderBy: { feeplanid: 'desc' }
  });

  if (!feePlan) {
    throw new Error(`No active fee plan found for program ${student.programid}`);
  }

  const tuitionFee = feePlan.tuitionpercredit * enrolledCredits;
  const labFee = feePlan.labfees;
  const registrationFee = feePlan.registrationfee;
  
  const totalBaseFee = tuitionFee + labFee + registrationFee;

  // Check for active scholarships
  const scholarships = await prisma.scholarship.findMany({
    where: { studentid: studentId, isactive: true }
  });

  // Calculate discount
  let totalDiscountPercentage = scholarships.reduce((acc, sch) => acc + sch.discountpercentage, 0);
  
  // Cap at 100%
  if (totalDiscountPercentage > 100) totalDiscountPercentage = 100;

  const discountAmount = (totalBaseFee * totalDiscountPercentage) / 100;

  return {
    tuitionFee,
    labFee,
    registrationFee,
    totalBaseFee,
    discountAmount,
    totalAmountDue: totalBaseFee - discountAmount
  };
};
