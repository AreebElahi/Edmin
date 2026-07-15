import prisma from '../../config/prisma.js';
import { updateFinancialClearance } from './financialClearance.service.js';
import { publishEvent } from '../workflow/eventPublisher.service.js';

export const processPayment = async (
  invoiceId: number, 
  amount: number, 
  method: 'CASH' | 'BANK' | 'CARD' | 'ONLINE',
  transactionRef?: string
) => {
  const result = await prisma.$transaction(async (tx) => {
    const invoice = await tx.studentinvoice.findUnique({
      where: { invoiceid: invoiceId }
    });

    if (!invoice) throw new Error('Invoice not found');

    const totalDue = invoice.totalamount + invoice.latefeeamount;
    const remainingBalance = totalDue - invoice.amountpaid;

    if (amount <= 0) throw new Error('Payment amount must be greater than zero');
    if (amount > remainingBalance) throw new Error('Payment exceeds remaining balance');

    // 1. Create Payment Record
    const payment = await tx.payment.create({
      data: {
        invoiceid: invoiceId,
        amount,
        method,
        transactionref: transactionRef
      }
    });

    // 2. Update Invoice
    const newAmountPaid = invoice.amountpaid + amount;
    const isFullyPaid = newAmountPaid >= totalDue;

    let newStatus = invoice.status;
    if (isFullyPaid) {
      newStatus = 'PAID';
    } else if (newAmountPaid > 0 && newAmountPaid < totalDue) {
      // If it was OVERDUE, it technically remains OVERDUE until fully paid,
      // but if PENDING, it becomes PARTIAL.
      newStatus = invoice.status === 'OVERDUE' ? 'OVERDUE' : 'PARTIAL'; 
    }

    const updatedInvoice = await tx.studentinvoice.update({
      where: { invoiceid: invoiceId },
      data: {
        amountpaid: newAmountPaid,
        status: newStatus
      }
    });

    await publishEvent(
      tx,
      'FINANCE',
      payment.paymentid,
      'PAYMENT_RECEIVED',
      {
        paymentId: payment.paymentid,
        invoiceId: invoice.invoiceid,
        studentId: invoice.studentid,
        amount
      }
    );

    return { payment, invoice: updatedInvoice, studentid: invoice.studentid };
  });

  // 3. Trigger Financial Clearance Update
  await updateFinancialClearance(result.studentid);

  return result;
};
