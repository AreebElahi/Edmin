import prisma from '../../../config/prisma.js';

export const getFinanceSummary = async () => {
  // Run all consolidated database queries concurrently
  const [
    allPayments,
    allInvoices,
    allPayrolls,
    scholarshipAgg
  ] = await Promise.all([
    prisma.payment.findMany({
      select: { amount: true, createdat: true },
      orderBy: { createdat: 'asc' }
    }),
    prisma.studentinvoice.findMany({
      select: {
        status: true,
        totalamount: true,
        latefeeamount: true,
        amountpaid: true
      }
    }),
    prisma.payroll.findMany({
      where: { status: 'APPROVED' },
      select: { netpay: true, month: true }
    }),
    prisma.scholarship.aggregate({
      _avg: { discountpercentage: true },
      _count: true
    })
  ]);

  // 1. Total Revenue (sum of all payments)
  const totalRevenue = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  // 2. Invoiced Total (sum of all invoices)
  const invoicedTotal = allInvoices.reduce((sum, inv) => sum + Number(inv.totalamount), 0);

  // 3. Outstanding Invoices Count
  const outstandingInvoices = allInvoices.filter(inv => inv.status !== 'PAID').length;

  // 4. Unpaid Invoice Amount
  const unpaidInvoiceAmount = allInvoices
    .filter(inv => inv.status !== 'PAID')
    .reduce((sum, inv) => {
      const totalDue = Number(inv.totalamount) + Number(inv.latefeeamount);
      const balance = totalDue - Number(inv.amountpaid);
      return sum + (balance > 0 ? balance : 0);
    }, 0);

  // 5. Scholarship stats
  const scholarshipAverage = scholarshipAgg._avg.discountpercentage ? Number(scholarshipAgg._avg.discountpercentage) : 0;
  const scholarshipCount = scholarshipAgg._count || 0;

  // 6. Approved Payroll Costs
  const payrollCosts = allPayrolls.reduce((sum, pr) => sum + Number(pr.netpay), 0);

  // 7. Collection Rate (payments / invoices ratio)
  const collectionRate = invoicedTotal > 0 ? (totalRevenue / invoicedTotal) * 100 : 0;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Initialize monthly map
  const monthlyMap: { [key: string]: number } = {};
  monthNames.forEach(m => {
    monthlyMap[m] = 0;
  });

  allPayments.forEach(p => {
    const date = new Date(p.createdat);
    const monthName = monthNames[date.getMonth()];
    monthlyMap[monthName] = (monthlyMap[monthName] || 0) + Number(p.amount);
  });

  const monthlyCollections = monthNames.map(name => ({
    month: name,
    amount: monthlyMap[name]
  }));

  // Invoice Statuses Breakdown
  const statusCounts: { [key: string]: number } = {
    PAID: 0,
    PARTIAL: 0,
    PENDING: 0,
    OVERDUE: 0,
    FAILED: 0,
    PROCESSING: 0
  };

  allInvoices.forEach(inv => {
    if (statusCounts[inv.status] !== undefined) {
      statusCounts[inv.status]++;
    }
  });

  const invoiceStatuses = Object.keys(statusCounts).map(status => ({
    status,
    count: statusCounts[status]
  }));

  // Revenue vs Payroll Comparison
  const payrollMonthlyMap: { [key: number]: number } = {};
  allPayrolls.forEach(pr => {
    payrollMonthlyMap[pr.month] = (payrollMonthlyMap[pr.month] || 0) + Number(pr.netpay);
  });

  const revenueVsPayroll = monthNames.map((name, index) => {
    const monthNum = index + 1; // 1-indexed for months
    return {
      month: name,
      revenue: monthlyMap[name],
      payroll: payrollMonthlyMap[monthNum] || 0
    };
  });

  return {
    totalRevenue,
    invoicedTotal,
    outstandingInvoices,
    unpaidInvoiceAmount,
    scholarshipAverage,
    scholarshipCount,
    payrollCosts,
    collectionRate,
    monthlyCollections,
    invoiceStatuses,
    revenueVsPayroll
  };
};

export const getAuditReportText = async () => {
  const summary = await getFinanceSummary();
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const lines = [
    "==================================================",
    "EDMIN UNIVERSITY - OFFICIAL FINANCIAL AUDIT STATEMENT",
    "==================================================",
    `Generated on: ${dateStr}`,
    "Fiscal Period: FY 2026 Q2",
    "",
    "--- KEY SUMMARY METRICS ---",
    `Total Revenue Collected: PKR ${summary.totalRevenue.toLocaleString()}`,
    `Total Tuition Invoiced: PKR ${summary.invoicedTotal.toLocaleString()}`,
    `Outstanding Invoices:   ${summary.outstandingInvoices}`,
    `Unpaid Invoiced Amount: PKR ${summary.unpaidInvoiceAmount.toLocaleString()}`,
    `Approved Payroll Costs: PKR ${summary.payrollCosts.toLocaleString()}`,
    `Collection Rate:        ${summary.collectionRate.toFixed(2)}%`,
    "",
    "--- SCHOLARSHIP STATS ---",
    `Active Scholarships:    ${summary.scholarshipCount}`,
    `Average Waiver Discount: ${summary.scholarshipAverage.toFixed(2)}%`,
    "",
    "--- INVOICE STATUS BREAKDOWN ---",
    ...summary.invoiceStatuses.map(s => ` - ${s.status}: ${s.count} invoice(s)`),
    "",
    "==================================================",
    "CONFIDENTIAL - INTERNAL AUDIT USE ONLY"
  ];
  return lines.join("\n");
};

export const getReconciliationCSV = async () => {
  const invoices = await prisma.studentinvoice.findMany({
    include: {
      student: true,
      semester: true
    }
  });

  const payments = await prisma.payment.findMany({
    include: {
      invoice: {
        include: {
          student: true
        }
      }
    }
  });

  let csv = "--- STUDENT INVOICES LEDGER ---\n";
  csv += "Invoice ID,Student Name,Roll Number,Semester,Total Amount (PKR),Amount Paid (PKR),Late Fee (PKR),Status,Due Date,CreatedAt\n";
  invoices.forEach(i => {
    csv += `${i.invoiceid},"${i.student?.fullname || ''}","${i.student?.rollnumber || ''}","${i.semester?.name || ''}",${i.totalamount},${i.amountpaid},${i.latefeeamount},${i.status},"${i.duedate.toISOString()}","${i.createdat.toISOString()}"\n`;
  });

  csv += "\n--- PAYMENTS RECEIVED LEDGER ---\n";
  csv += "Payment ID,Invoice ID,Student Name,Roll Number,Amount (PKR),Method,TransactionReference,RecordedAt\n";
  payments.forEach(p => {
    csv += `${p.paymentid},${p.invoiceid},"${p.invoice?.student?.fullname || ''}","${p.invoice?.student?.rollnumber || ''}",${p.amount},${p.method},"${p.transactionref || ''}","${p.createdat.toISOString()}"\n`;
  });

  return csv;
};

export const getPayrollLedgerCSV = async () => {
  const payrolls = await prisma.payroll.findMany({
    include: {
      user: {
        include: {
          faculty: {
            include: {
              department: true
            }
          }
        }
      }
    }
  });

  let csv = "Payroll ID,Employee Name,Employee Number,Department,Period,Base Salary (PKR),Net Paid (PKR),Status,CreatedAt\n";
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  payrolls.forEach(p => {
    const faculty = (p.user?.faculty as any);
    const dept = faculty?.department?.name || 'N/A';
    csv += `${p.payrollid},"${faculty?.fullname || p.user?.username || ''}","${faculty?.employeenumber || ''}","${dept}","${months[p.month - 1]} ${p.year}",${faculty?.basesalary || 0},${p.netpay},${p.status},"${p.createdat.toISOString()}"\n`;
  });

  return csv;
};

export const getScholarshipReviewText = async () => {
  const scholarships = await prisma.scholarship.findMany({
    include: {
      student: true
    }
  });

  const summary = await getFinanceSummary();

  let text = "==================================================\n";
  text += "EDMIN UNIVERSITY - SCHOLARSHIPS & WAIVERS DETAIL REPORT\n";
  text += "==================================================\n\n";
  text += `Total Active Scholarships: ${summary.scholarshipCount}\n`;
  text += `Average Discount Waiver:   ${summary.scholarshipAverage.toFixed(2)}%\n\n`;
  text += "--- ACTIVE STUDENT RECIPIENTS ---\n";
  
  if (scholarships.length === 0) {
    text += "No active student scholarship records found in database.\n";
  } else {
    scholarships.forEach((s, idx) => {
      text += `${idx + 1}. Student: ${s.student?.fullname || ''} (${s.student?.rollnumber || ''})\n`;
      text += `   Discount Percentage: ${s.discountpercentage}%\n`;
    });
  }

  return text;
};
