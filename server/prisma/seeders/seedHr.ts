import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding HR and HOD records...');
  
  const anyDept = await prisma.department.findFirst();
  if (anyDept) {
    await prisma.departmentevent.createMany({
      data: [
        { departmentid: anyDept.departmentid, title: 'Department Faculty Meeting', date: new Date(Date.now() + 86400000 * 2), time: '10:00 AM', type: 'Meeting', description: 'Monthly alignment meeting' },
        { departmentid: anyDept.departmentid, title: 'Curriculum Review', date: new Date(Date.now() + 86400000 * 5), time: '2:00 PM', type: 'Workshop', description: 'Reviewing next semester curriculum' },
        { departmentid: anyDept.departmentid, title: 'Guest Lecture', date: new Date(Date.now() + 86400000 * 10), time: '11:00 AM', type: 'Event', description: 'AI in Education' },
      ],
      skipDuplicates: true
    });
  }

  const faculties = await prisma.faculty.findMany();
  for (const f of faculties) {
    const existing = await prisma.payroll.findFirst({ where: { userid: f.userid } });
    if (!existing) {
      const payroll = await prisma.payroll.create({
        data: {
          userid: f.userid,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          netpay: 8500.00,
          status: 'APPROVED'
        }
      });
      
      await prisma.payrollcomponent.createMany({
        data: [
          { payrollid: payroll.payrollid, type: 'EARNING', name: 'Basic Salary', amount: 9000.00 },
          { payrollid: payroll.payrollid, type: 'EARNING', name: 'Allowances', amount: 1000.00 },
          { payrollid: payroll.payrollid, type: 'DEDUCTION', name: 'Tax', amount: 1200.00 },
          { payrollid: payroll.payrollid, type: 'DEDUCTION', name: 'Health Insurance', amount: 300.00 },
        ]
      });

      const prevMonth = new Date().getMonth() === 0 ? 12 : new Date().getMonth();
      const prevYear = new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear();

      const prevPayroll = await prisma.payroll.create({
        data: {
          userid: f.userid,
          month: prevMonth,
          year: prevYear,
          netpay: 8500.00,
          status: 'APPROVED'
        }
      });

      await prisma.payrollcomponent.createMany({
        data: [
          { payrollid: prevPayroll.payrollid, type: 'EARNING', name: 'Basic Salary', amount: 9000.00 },
          { payrollid: prevPayroll.payrollid, type: 'EARNING', name: 'Allowances', amount: 1000.00 },
          { payrollid: prevPayroll.payrollid, type: 'DEDUCTION', name: 'Tax', amount: 1200.00 },
          { payrollid: prevPayroll.payrollid, type: 'DEDUCTION', name: 'Health Insurance', amount: 300.00 },
        ]
      });
    }
  }

  console.log('Done seeding HR data');
}

main().catch(console.error).finally(() => prisma.$disconnect());
