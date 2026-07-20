import prisma from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';

export const calculateFeeForSemester = async (studentId: number, semesterId: number, enrolledCredits: number) => {
  const student = await prisma.student.findUnique({
    where: { studentid: studentId }
  });

  if (!student || (!student.programid && !student.departmentid)) {
    throw new AppError('Student or Department not found', 400);
  }

  let programId = student.programid;

  // Fallback: If student has no specific program assigned, find the first program in their department
  if (!programId && student.departmentid) {
    const defaultProgram = await prisma.program.findFirst({
      where: { departmentid: student.departmentid }
    });
    if (defaultProgram) {
      programId = defaultProgram.programid;
    }
  }

  let feePlan;

  if (programId) {
    feePlan = await prisma.feeplan.findFirst({
      where: { 
        programid: programId,
        isactive: true
      },
      orderBy: { feeplanid: 'desc' }
    });
  }

  // Fallback 1: Any active fee plan
  if (!feePlan) {
    feePlan = await prisma.feeplan.findFirst({
      where: { isactive: true },
      orderBy: { feeplanid: 'desc' }
    });
  }

  // Fallback 2: Hardcoded defaults if nothing in DB
  if (!feePlan) {
    feePlan = {
      tuitionpercredit: 100,
      labfees: 50,
      registrationfee: 20
    } as any;
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
