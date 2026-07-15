import prisma from '../../../config/prisma.js';

export const getAllPayrolls = async () => {
  const records = await prisma.payroll.findMany({
    where: { isactive: true },
    include: {
      user: {
        select: {
          userid: true,
          username: true,
          email: true,
          role: true,
          faculty: {
            where: { isactive: true },
            select: {
              facultyid: true,
              fullname: true,
              employeenumber: true,
              basesalary: true,
              department: {
                select: {
                  name: true,
                  code: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: [
      { year: 'desc' },
      { month: 'desc' },
      { payrollid: 'desc' }
    ]
  });

  // Format to flatten faculty fields for frontend convenience
  return records.map(record => {
    const faculty = record.user.faculty?.[0] || null;
    return {
      payrollid: record.payrollid,
      month: record.month,
      year: record.year,
      netpay: record.netpay,
      status: record.status,
      createdat: record.createdat,
      userid: record.userid,
      username: record.user.username,
      email: record.user.email,
      role: record.user.role,
      fullname: faculty?.fullname || record.user.username,
      employeenumber: faculty?.employeenumber || `EMP-${record.userid}`,
      basesalary: faculty?.basesalary || 0,
      departmentName: faculty?.department?.name || 'Administrative'
    };
  });
};

export const getPayrollById = async (payrollId: number) => {
  const record = await prisma.payroll.findUnique({
    where: { payrollid: payrollId },
    include: {
      user: {
        select: {
          userid: true,
          username: true,
          email: true,
          role: true,
          faculty: {
            where: { isactive: true },
            select: {
              facultyid: true,
              fullname: true,
              employeenumber: true,
              basesalary: true,
              department: {
                select: {
                  name: true,
                  code: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!record) return null;

  const faculty = record.user.faculty?.[0] || null;

  const startOfMonth = new Date(record.year, record.month - 1, 1);
  const endOfMonth = new Date(record.year, record.month, 0, 23, 59, 59);

  const leavesCount = await prisma.leaverequest.count({
    where: {
      userid: record.userid,
      status: 'APPROVED',
      startdate: { lte: endOfMonth },
      enddate: { gte: startOfMonth }
    }
  });

  let reportsCount = 0;
  if (faculty) {
    reportsCount = await prisma.dailyactivityreport.count({
      where: {
        facultyid: faculty.facultyid,
        status: 'APPROVED',
        reportdate: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });
  }

  return {
    payrollid: record.payrollid,
    month: record.month,
    year: record.year,
    netpay: record.netpay,
    status: record.status,
    createdat: record.createdat,
    userid: record.userid,
    username: record.user.username,
    email: record.user.email,
    role: record.user.role,
    fullname: faculty?.fullname || record.user.username,
    employeenumber: faculty?.employeenumber || `EMP-${record.userid}`,
    basesalary: faculty?.basesalary || 0,
    departmentName: faculty?.department?.name || 'Administrative',
    leavesCount,
    reportsCount
  };
};
