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
import { redisConnection, acquireLock, releaseLock } from '../../config/redis.js';
import { sendSuccess, sendError } from "../../contracts/api.contracts.js";
import { getCachedResponse, setCachedResponse } from "../../config/redis.js";

const invalidateFinanceSummaryCache = async () => {
  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del('api:admin:finance:summary');
  }
};

// Payroll
export const getPayrollsHandler = catchAsync(async (req: Request, res: Response) => {
  const cacheKey = 'api:admin:finance:payrolls';

  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  let isLeader = false;
  if (redisConnection && redisConnection.status === 'ready') {
    isLeader = await acquireLock(cacheKey, 5);
  } else {
    isLeader = true;
  }

  if (isLeader) {
    try {
      const payrolls = await getAllPayrolls();
      const fullResponse = { success: true, data: payrolls };

      if (redisConnection && redisConnection.status === 'ready') {
        await redisConnection.setex(cacheKey, 30, JSON.stringify(fullResponse));
        await releaseLock(cacheKey);
      }
      return sendSuccess(res, (fullResponse as any).data || fullResponse, undefined, undefined, 200);
    } catch (error) {
      if (redisConnection && redisConnection.status === 'ready') {
        await releaseLock(cacheKey);
      }
      throw error;
    }
  } else {
    for (let attempt = 0; attempt < 10; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const cached = await redisConnection!.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(cached);
      }
    }
    const payrolls = await getAllPayrolls();
    return sendSuccess(res, payrolls, undefined, undefined, 200);
  }
});

export const getPayrollByIdHandler = catchAsync(async (req: Request, res: Response) => {
  const payrollId = Number(req.params.id);
  if (isNaN(payrollId)) {
    return sendError(res, 'Invalid payroll ID', [], 400);
  }

  const payroll = await getPayrollById(payrollId);
  if (!payroll) {
    return sendError(res, 'Payroll record not found', [], 404);
  }

  sendSuccess(res, payroll, undefined, undefined, 200);
});

// Reports
export const getFinanceReportsHandler = catchAsync(async (req: Request, res: Response) => {
  const cacheKey = 'api:admin:finance:summary';

  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  let isLeader = false;
  if (redisConnection && redisConnection.status === 'ready') {
    isLeader = await acquireLock(cacheKey, 5);
  } else {
    isLeader = true;
  }

  if (isLeader) {
    try {
      const summary = await getFinanceSummary();
      const fullResponse = { success: true, data: summary };

      if (redisConnection && redisConnection.status === 'ready') {
        await redisConnection.setex(cacheKey, 30, JSON.stringify(fullResponse)); // Cache for 30 seconds
        await releaseLock(cacheKey);
      }
      return sendSuccess(res, (fullResponse as any).data || fullResponse, undefined, undefined, 200);
    } catch (error) {
      if (redisConnection && redisConnection.status === 'ready') {
        await releaseLock(cacheKey);
      }
      throw error;
    }
  } else {
    for (let attempt = 0; attempt < 10; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const cached = await redisConnection!.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(cached);
      }
    }
    const summary = await getFinanceSummary();
    return sendSuccess(res, summary, undefined, undefined, 200);
  }
});

// Fees Config
export const getFeePlansHandler = catchAsync(async (req: Request, res: Response) => {
  const cacheKey = 'api:admin:finance:feeplans';

  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  let isLeader = false;
  if (redisConnection && redisConnection.status === 'ready') {
    isLeader = await acquireLock(cacheKey, 5);
  } else {
    isLeader = true;
  }

  if (isLeader) {
    try {
      const feePlans = await getAllFeePlans();
      const fullResponse = { success: true, data: feePlans };

      if (redisConnection && redisConnection.status === 'ready') {
        await redisConnection.setex(cacheKey, 30, JSON.stringify(fullResponse));
        await releaseLock(cacheKey);
      }
      return sendSuccess(res, (fullResponse as any).data || fullResponse, undefined, undefined, 200);
    } catch (error) {
      if (redisConnection && redisConnection.status === 'ready') {
        await releaseLock(cacheKey);
      }
      throw error;
    }
  } else {
    for (let attempt = 0; attempt < 10; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const cached = await redisConnection!.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(cached);
      }
    }
    const feePlans = await getAllFeePlans();
    return sendSuccess(res, feePlans, undefined, undefined, 200);
  }
});

export const createFeePlanHandler = catchAsync(async (req: Request, res: Response) => {
  const { programid, tuitionpercredit, labfees, registrationfee } = req.body;
  if (!programid || tuitionpercredit === undefined || labfees === undefined || registrationfee === undefined) {
    return sendError(res, 'Missing required fee plan parameters', [], 400);
  }

  const feePlan = await createFeePlan({
    programid: Number(programid),
    tuitionpercredit: Number(tuitionpercredit),
    labfees: Number(labfees),
    registrationfee: Number(registrationfee)
  });

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del('api:admin:finance:feeplans');
  }
  await invalidateFinanceSummaryCache();

  sendSuccess(res, feePlan, undefined, undefined, 201);
});

// Invoices
export const getInvoicesHandler = catchAsync(async (req: Request, res: Response) => {
  const cacheKey = 'api:admin:finance:invoices';

  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  let isLeader = false;
  if (redisConnection && redisConnection.status === 'ready') {
    isLeader = await acquireLock(cacheKey, 5);
  } else {
    isLeader = true;
  }

  if (isLeader) {
    try {
      const invoices = await getAllInvoices();
      const fullResponse = { success: true, data: invoices };

      if (redisConnection && redisConnection.status === 'ready') {
        await redisConnection.setex(cacheKey, 30, JSON.stringify(fullResponse));
        await releaseLock(cacheKey);
      }
      return sendSuccess(res, (fullResponse as any).data || fullResponse, undefined, undefined, 200);
    } catch (error) {
      if (redisConnection && redisConnection.status === 'ready') {
        await releaseLock(cacheKey);
      }
      throw error;
    }
  } else {
    for (let attempt = 0; attempt < 10; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const cached = await redisConnection!.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(cached);
      }
    }
    const invoices = await getAllInvoices();
    return sendSuccess(res, invoices, undefined, undefined, 200);
  }
});

export const generateInvoiceHandler = catchAsync(async (req: Request, res: Response) => {
  const { studentId, semesterId, enrolledCredits } = req.body;
  if (!studentId || !semesterId) {
    return sendError(res, 'studentId and semesterId are required', [], 400);
  }

  const invoice = await generateInvoice({
    studentId: Number(studentId),
    semesterId: Number(semesterId),
    enrolledCredits: enrolledCredits ? Number(enrolledCredits) : undefined
  });

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del('api:admin:finance:invoices');
  }
  await invalidateFinanceSummaryCache();

  sendSuccess(res, invoice, undefined, undefined, 201);
});

// Payments
export const getPaymentsHandler = catchAsync(async (req: Request, res: Response) => {
  const cacheKey = 'api:admin:finance:payments';

  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  let isLeader = false;
  if (redisConnection && redisConnection.status === 'ready') {
    isLeader = await acquireLock(cacheKey, 5);
  } else {
    isLeader = true;
  }

  if (isLeader) {
    try {
      const payments = await getAllPayments();
      const fullResponse = { success: true, data: payments };

      if (redisConnection && redisConnection.status === 'ready') {
        await redisConnection.setex(cacheKey, 30, JSON.stringify(fullResponse));
        await releaseLock(cacheKey);
      }
      return sendSuccess(res, (fullResponse as any).data || fullResponse, undefined, undefined, 200);
    } catch (error) {
      if (redisConnection && redisConnection.status === 'ready') {
        await releaseLock(cacheKey);
      }
      throw error;
    }
  } else {
    for (let attempt = 0; attempt < 10; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const cached = await redisConnection!.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(cached);
      }
    }
    const payments = await getAllPayments();
    return sendSuccess(res, payments, undefined, undefined, 200);
  }
});

export const recordPaymentHandler = catchAsync(async (req: Request, res: Response) => {
  const { invoiceId, amount, method, transactionRef } = req.body;
  if (!invoiceId || !amount || !method) {
    return sendError(res, 'invoiceId, amount, and method are required', [], 400);
  }

  const paymentResult = await recordPayment({
    invoiceId: Number(invoiceId),
    amount: Number(amount),
    method,
    transactionRef
  });

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del('api:admin:finance:payments');
    await redisConnection.del('api:admin:finance:invoices');
  }
  await invalidateFinanceSummaryCache();

  sendSuccess(res, paymentResult, undefined, undefined, 201);
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

  return sendError(res, 'Invalid download report type', [], 400);
});
