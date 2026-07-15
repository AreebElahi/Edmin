import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  getPayrolls, getPayrollById, getFinanceReports,
  getFeePlans, createFeePlan, getInvoices, generateInvoice,
  getPayments, recordPayment, CreateFeePlanPayload,
  GenerateInvoicePayload, RecordPaymentPayload
} from '../api/financeApi';

export const FINANCE_QUERY_KEYS = {
  payrolls: ['finance', 'payrolls'] as const,
  payrollDetails: (id: number) => ['finance', 'payroll', id] as const,
  reports: ['finance', 'reports'] as const,
  feePlans: ['finance', 'feePlans'] as const,
  invoices: ['finance', 'invoices'] as const,
  payments: ['finance', 'payments'] as const,
};

export function usePayrolls() {
  return useQuery({
    queryKey: FINANCE_QUERY_KEYS.payrolls,
    queryFn: getPayrolls,
    staleTime: 60 * 1000,
  });
}

export function usePayrollDetails(id: number) {
  return useQuery({
    queryKey: FINANCE_QUERY_KEYS.payrollDetails(id),
    queryFn: () => getPayrollById(id),
    enabled: !!id && !isNaN(id) && id > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFinanceReports() {
  return useQuery({
    queryKey: FINANCE_QUERY_KEYS.reports,
    queryFn: getFinanceReports,
    staleTime: 30 * 1000,
  });
}

export function useFeePlans() {
  return useQuery({
    queryKey: FINANCE_QUERY_KEYS.feePlans,
    queryFn: getFeePlans,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateFeePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFeePlanPayload) => createFeePlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCE_QUERY_KEYS.feePlans });
      toast.success('Fee plan created successfully!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create fee plan');
    }
  });
}

export function useInvoices() {
  return useQuery({
    queryKey: FINANCE_QUERY_KEYS.invoices,
    queryFn: getInvoices,
    staleTime: 2 * 60 * 1000,
  });
}

export function useGenerateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateInvoicePayload) => generateInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCE_QUERY_KEYS.invoices });
      queryClient.invalidateQueries({ queryKey: FINANCE_QUERY_KEYS.reports });
      toast.success('Student invoice generated successfully!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to generate student invoice');
    }
  });
}

export function usePayments() {
  return useQuery({
    queryKey: FINANCE_QUERY_KEYS.payments,
    queryFn: getPayments,
    staleTime: 2 * 60 * 1000,
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RecordPaymentPayload) => recordPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCE_QUERY_KEYS.payments });
      queryClient.invalidateQueries({ queryKey: FINANCE_QUERY_KEYS.invoices });
      queryClient.invalidateQueries({ queryKey: FINANCE_QUERY_KEYS.reports });
      toast.success('Payment recorded successfully!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to record payment');
    }
  });
}
