import prisma from '../../../config/prisma.js';

export const getAllFeePlans = async () => {
  return await prisma.feeplan.findMany({
    where: { isactive: true },
    include: {
      program: {
        select: {
          name: true,
          code: true
        }
      }
    },
    orderBy: { feeplanid: 'desc' }
  });
};

export const createFeePlan = async (data: {
  programid: number;
  tuitionpercredit: number;
  labfees: number;
  registrationfee: number;
}) => {
  return await prisma.feeplan.create({
    data: {
      programid: data.programid,
      tuitionpercredit: data.tuitionpercredit,
      labfees: data.labfees,
      registrationfee: data.registrationfee,
      isactive: true
    },
    include: {
      program: true
    }
  });
};
