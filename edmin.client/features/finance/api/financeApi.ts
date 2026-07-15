import { apiGet, apiPost } from '@/api/apiContract';

// Payroll Types
export interface PayrollRecord {
  payrollid: number;
  month: number;
  year: number;
  netpay: number;
  status: 'DRAFT' | 'APPROVED' | 'REJECTED';
  createdat: string;
  userid: number;
  username: string;
  email: string;
  role: string;
  fullname: string;
  employeenumber: string;
  basesalary: number;
  departmentName: string;
  leavesCount?: number;
  reportsCount?: number;
}

// Reports Types
export interface MonthlyCollection {
  month: string;
  amount: number;
}

export interface InvoiceStatusBreakdown {
  status: string;
  count: number;
}

export interface RevenueVsPayroll {
  month: string;
  revenue: number;
  payroll: number;
}

export interface FinanceReportsSummary {
  totalRevenue: number;
  invoicedTotal: number;
  outstandingInvoices: number;
  unpaidInvoiceAmount: number;
  scholarshipAverage: number;
  scholarshipCount: number;
  payrollCosts: number;
  collectionRate: number;
  monthlyCollections: MonthlyCollection[];
  invoiceStatuses: InvoiceStatusBreakdown[];
  revenueVsPayroll: RevenueVsPayroll[];
}

// Fee Plan Types
export interface FeePlan {
  feeplanid: number;
  programid: number;
  semester: number | null;
  tuitionpercredit: number;
  labfees: number;
  registrationfee: number;
  isactive: boolean;
  program?: {
    name: string;
    code: string;
  };
}

export interface CreateFeePlanPayload {
  programid: number;
  tuitionpercredit: number;
  labfees: number;
  registrationfee: number;
}

// Invoice Types
export interface InvoiceItem {
  invoiceitemid: number;
  invoiceid: number;
  description: string;
  amount: number;
  type: 'TUITION' | 'LAB_FEE' | 'REGISTRATION_FEE' | 'PENALTY' | 'DISCOUNT' | 'OTHER';
}

export interface StudentInvoice {
  invoiceid: number;
  studentid: number;
  semesterid: number;
  totalamount: number;
  amountpaid: number;
  latefeeamount: number;
  duedate: string;
  status: 'PROCESSING' | 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'FAILED';
  createdat: string;
  student: {
    studentid: number;
    rollnumber: string;
    fullname: string | null;
    user: {
      username: string;
    };
  };
  semester: {
    semesterid: number;
    name: string;
  };
  items: InvoiceItem[];
}

export interface GenerateInvoicePayload {
  studentId: number;
  semesterId: number;
  enrolledCredits?: number;
}

// Payment Types
export interface PaymentRecord {
  paymentid: number;
  invoiceid: number;
  amount: number;
  method: 'CASH' | 'BANK' | 'CARD' | 'ONLINE';
  transactionref: string | null;
  createdat: string;
  invoice: {
    invoiceid: number;
    totalamount: number;
    amountpaid: number;
    status: string;
    student: {
      rollnumber: string;
      fullname: string | null;
      user: {
        username: string;
      };
    };
  };
}

export interface RecordPaymentPayload {
  invoiceId: number;
  amount: number;
  method: 'CASH' | 'BANK' | 'CARD' | 'ONLINE';
  transactionRef?: string;
}

/** Get list of payroll entries */
export function getPayrolls(): Promise<PayrollRecord[]> {
  return apiGet<PayrollRecord[]>('/admin/finance/payroll');
}

/** Get a single payroll entry by ID */
export function getPayrollById(id: number): Promise<PayrollRecord> {
  return apiGet<PayrollRecord>(`/admin/finance/payroll/${id}`);
}

/** Get finance reports dashboard summary statistics */
export function getFinanceReports(): Promise<FinanceReportsSummary> {
  return apiGet<FinanceReportsSummary>('/admin/finance/reports');
}

/** Get list of active fee plans */
export function getFeePlans(): Promise<FeePlan[]> {
  return apiGet<FeePlan[]>('/admin/finance/fees');
}

/** Create a new fee plan */
export function createFeePlan(data: CreateFeePlanPayload): Promise<FeePlan> {
  return apiPost<FeePlan>('/admin/finance/fees', data);
}

/** Get list of all student invoices */
export function getInvoices(): Promise<StudentInvoice[]> {
  return apiGet<StudentInvoice[]>('/admin/finance/invoices');
}

/** Generate a semester invoice for a student */
export function generateInvoice(data: GenerateInvoicePayload): Promise<StudentInvoice> {
  return apiPost<StudentInvoice>('/admin/finance/invoices/generate', data);
}

/** Get list of payment receipts */
export function getPayments(): Promise<PaymentRecord[]> {
  return apiGet<PaymentRecord[]>('/admin/finance/payments');
}

/** Record a student fee payment */
export function recordPayment(data: RecordPaymentPayload): Promise<any> {
  return apiPost<any>('/admin/finance/payments/record', data);
}
