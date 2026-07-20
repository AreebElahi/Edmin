import prisma from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';
import { calculateFeeForSemester } from './feeCalculation.service.js';
import { publishEvent } from '../workflow/eventPublisher.service.js';

export const generateInvoiceForSemester = async (studentId: number, semesterId: number, enrolledCredits: number) => {
  // 1. Calculate Fees
  const fees = await calculateFeeForSemester(studentId, semesterId, enrolledCredits);

  // Default Due Date: 30 days from now (could be dynamic based on semester rules)
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  // 2. Wrap Invoice Creation in Transaction
  return await prisma.$transaction(async (tx) => {
    // Check if an invoice already exists
    const existing = await tx.studentinvoice.findUnique({
      where: { 
        studentid_semesterid: {
          studentid: studentId,
          semesterid: semesterId
        }
      }
    });

    if (existing && existing.status !== 'PROCESSING') {
      // Idempotency: If already generated, return existing safely without throwing
      return existing;
    }

    // Upsert Invoice (creates if missing, updates if PROCESSING shell exists)
    const invoice = await tx.studentinvoice.upsert({
      where: {
        studentid_semesterid: {
          studentid: studentId,
          semesterid: semesterId
        }
      },
      update: {
        totalamount: fees.totalAmountDue,
        duedate: dueDate,
        status: 'PENDING'
      },
      create: {
        studentid: studentId,
        semesterid: semesterId,
        totalamount: fees.totalAmountDue,
        duedate: dueDate,
        status: 'PENDING'
      }
    });

    // Create Line Items
    const items = [];

    if (fees.tuitionFee > 0) {
      items.push({
        invoiceid: invoice.invoiceid,
        description: `Tuition Fee (${enrolledCredits} Credits)`,
        amount: fees.tuitionFee,
        type: 'TUITION' as const
      });
    }

    if (fees.labFee > 0) {
      items.push({
        invoiceid: invoice.invoiceid,
        description: 'Lab Fee',
        amount: fees.labFee,
        type: 'LAB_FEE' as const
      });
    }

    if (fees.registrationFee > 0) {
      items.push({
        invoiceid: invoice.invoiceid,
        description: 'Registration Fee',
        amount: fees.registrationFee,
        type: 'REGISTRATION_FEE' as const
      });
    }

    if (fees.discountAmount > 0) {
      items.push({
        invoiceid: invoice.invoiceid,
        description: 'Scholarship / Discount',
        amount: -fees.discountAmount, // Negative amount
        type: 'DISCOUNT' as const
      });
    }

    await tx.invoiceitem.createMany({
      data: items
    });

    // Return full invoice
    const finalInvoice = await tx.studentinvoice.findUnique({
      where: { invoiceid: invoice.invoiceid },
      include: { items: true }
    });

    await publishEvent(
      tx,
      'FINANCE',
      invoice.invoiceid,
      'INVOICE_GENERATED',
      {
        invoiceId: invoice.invoiceid,
        studentId: invoice.studentid,
        totalAmount: invoice.totalamount,
        dueDate: invoice.duedate
      }
    );

    return finalInvoice;
  });
};

export const applyLateFeePenalty = async (invoiceId: number, penaltyAmount: number) => {
  return await prisma.$transaction(async (tx) => {
    const invoice = await tx.studentinvoice.findUnique({ where: { invoiceid: invoiceId } });
    if (!invoice) throw new AppError('Invoice not found', 404);
    if (invoice.status === 'PAID') throw new AppError('Cannot apply late fee to paid invoice', 400);

    const history = (invoice.latefeehistory as any[]) || [];
    history.push({
      date: new Date(),
      amount: penaltyAmount,
      reason: 'Automated Late Fee Penalty'
    });

    // We keep totalamount original. 
    // The true due balance becomes: totalamount + latefeeamount - amountpaid
    const updated = await tx.studentinvoice.update({
      where: { invoiceid: invoiceId },
      data: {
        latefeeamount: invoice.latefeeamount + penaltyAmount,
        latefeehistory: history,
        status: 'OVERDUE'
      }
    });

    return updated;
  });
};
