import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync.js';
import { getAllPayrolls, getPayrollById } from '../../services/admin/finance/payroll.service.js';
import { 
  getFinanceSummary, getAuditReportText, getReconciliationCSV, 
  getPayrollLedgerCSV, getScholarshipReviewText 
} from '../../services/admin/finance/report.service.js';
import { getAllFeePlans, createFeePlan } from '../../services/admin/finance/fees.service.js';
import { getAllInvoices, generateInvoice } from '../../services/admin/finance/invoices.service.js';
import { getAllPayments, recordPayment } from '../../services/admin/finance/payments.service.js';

// Payroll
export const getPayrollsHandler = catchAsync(async (req: Request, res: Response) => {
  const payrolls = await getAllPayrolls();
  res.status(200).json({
    success: true,
    data: payrolls
  });
});

export const getPayrollByIdHandler = catchAsync(async (req: Request, res: Response) => {
  const payrollId = Number(req.params.id);
  if (isNaN(payrollId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid payroll ID'
    });
  }

  const payroll = await getPayrollById(payrollId);
  if (!payroll) {
    return res.status(404).json({
      success: false,
      message: 'Payroll record not found'
    });
  }

  res.status(200).json({
    success: true,
    data: payroll
  });
});

// Reports
export const getFinanceReportsHandler = catchAsync(async (req: Request, res: Response) => {
  const summary = await getFinanceSummary();
  res.status(200).json({
    success: true,
    data: summary
  });
});

// Fees Config
export const getFeePlansHandler = catchAsync(async (req: Request, res: Response) => {
  const feePlans = await getAllFeePlans();
  res.status(200).json({
    success: true,
    data: feePlans
  });
});

export const createFeePlanHandler = catchAsync(async (req: Request, res: Response) => {
  const { programid, tuitionpercredit, labfees, registrationfee } = req.body;
  if (!programid || tuitionpercredit === undefined || labfees === undefined || registrationfee === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fee plan parameters'
    });
  }

  const feePlan = await createFeePlan({
    programid: Number(programid),
    tuitionpercredit: Number(tuitionpercredit),
    labfees: Number(labfees),
    registrationfee: Number(registrationfee)
  });

  res.status(201).json({
    success: true,
    data: feePlan
  });
});

// Invoices
export const getInvoicesHandler = catchAsync(async (req: Request, res: Response) => {
  const invoices = await getAllInvoices();
  res.status(200).json({
    success: true,
    data: invoices
  });
});

export const generateInvoiceHandler = catchAsync(async (req: Request, res: Response) => {
  const { studentId, semesterId, enrolledCredits } = req.body;
  if (!studentId || !semesterId) {
    return res.status(400).json({
      success: false,
      message: 'studentId and semesterId are required'
    });
  }

  const invoice = await generateInvoice({
    studentId: Number(studentId),
    semesterId: Number(semesterId),
    enrolledCredits: enrolledCredits ? Number(enrolledCredits) : undefined
  });

  res.status(201).json({
    success: true,
    data: invoice
  });
});

// Payments
export const getPaymentsHandler = catchAsync(async (req: Request, res: Response) => {
  const payments = await getAllPayments();
  res.status(200).json({
    success: true,
    data: payments
  });
});

export const recordPaymentHandler = catchAsync(async (req: Request, res: Response) => {
  const { invoiceId, amount, method, transactionRef } = req.body;
  if (!invoiceId || !amount || !method) {
    return res.status(400).json({
      success: false,
      message: 'invoiceId, amount, and method are required'
    });
  }

  const paymentResult = await recordPayment({
    invoiceId: Number(invoiceId),
    amount: Number(amount),
    method,
    transactionRef
  });

  res.status(201).json({
    success: true,
    data: paymentResult
  });
});

export const downloadFinanceReportHandler = catchAsync(async (req: Request, res: Response) => {
  const { type } = req.params;

  if (type === 'audit') {
    const text = await getAuditReportText();
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="FY_2026_Q2_Financial_Audit_Statement.txt"');
    return res.status(200).send(text);
  }

  if (type === 'reconciliation') {
    const csv = await getReconciliationCSV();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="Tuition_Revenue_Payment_Ledger_Reconciliation.csv"');
    return res.status(200).send(csv);
  }

  if (type === 'payroll') {
    const csv = await getPayrollLedgerCSV();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="Faculty_Salary_Disbursals_Ledger.csv"');
    return res.status(200).send(csv);
  }

  if (type === 'scholarship') {
    const text = await getScholarshipReviewText();
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="Institutional_Waiver_Scholarship_Review.txt"');
    return res.status(200).send(text);
  }

  if (type === 'all') {
    const summary = await getFinanceSummary();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="financial_reports_export.json"');
    return res.status(200).send(JSON.stringify(summary, null, 2));
  }

  return res.status(400).json({
    success: false,
    message: 'Invalid download report type'
  });
});
