import prisma from '../../config/prisma.js';

export const getAnalytics = async (userId: number) => {
  const faculty = await prisma.faculty.findFirst({
    where: { userid: userId, isactive: true },
  });

  if (!faculty) throw new Error('Faculty profile not found');

  // TODO(Phase10): Compute real analytics from actual student and course data
  const stats: any[] = [];
  const coursePerformance: any[] = [];

  return { stats, coursePerformance };
};

export const getHrSummary = async (userId: number) => {
  const [faculty, resolvedLeaves, payrollRecords] = await Promise.all([
    prisma.faculty.findFirst({
      where: { userid: userId, isactive: true },
    }),
    prisma.leaverequest.findMany({
      where: {
        userid: userId
      },
      orderBy: { updatedat: 'desc' },
      select: {
        leaverequestid: true,
        leavetype: true,
        startdate: true,
        enddate: true,
        status: true,
        updatedat: true
      }
    }),
    prisma.payroll.findMany({
      where: { userid: userId },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ],
      select: {
        payrollid: true,
        month: true,
        year: true,
        netpay: true,
        status: true
      }
    })
  ]);

  if (!faculty) throw new Error('Faculty profile not found');

  return { resolvedLeaves, payrollRecords };
};

export const getPayslip = async (userId: number, payrollId: number) => {
  const payroll = await prisma.payroll.findFirst({
    where: { payrollid: payrollId, userid: userId },
    include: {
      payrollcomponent: true
    }
  });

  if (!payroll) throw new Error('Payroll record not found');

  return payroll;
};
