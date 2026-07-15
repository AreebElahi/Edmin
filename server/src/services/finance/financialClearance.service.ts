import prisma from '../../config/prisma.js';
import { financial_status } from '@prisma/client';

export const updateFinancialClearance = async (studentId: number) => {
  // Find all invoices
  const invoices = await prisma.studentinvoice.findMany({
    where: { studentid: studentId }
  });

  let hasOverdue = false;
  let hasPending = false;
  let hasPartial = false;

  for (const inv of invoices) {
    if (inv.status === 'OVERDUE') hasOverdue = true;
    if (inv.status === 'PENDING') hasPending = true;
    if (inv.status === 'PARTIAL') hasPartial = true;
  }

  // Admin manually sets BLOCKED sometimes, so we shouldn't automatically override a BLOCKED status
  // unless we're sure. For now, we only transition between CLEARED and HOLD dynamically.
  const student = await prisma.student.findUnique({
    where: { studentid: studentId }
  });

  if (!student) throw new Error('Student not found');
  
  // If explicitly BLOCKED by admin, don't auto-clear
  if (student.financialstatus === 'BLOCKED') {
    return 'BLOCKED';
  }

  let newStatus: financial_status = 'CLEARED';

  if (hasOverdue || hasPartial) {
    newStatus = 'HOLD';
  }
  
  if (student.financialstatus !== newStatus) {
    await prisma.student.update({
      where: { studentid: studentId },
      data: { financialstatus: newStatus }
    });
  }

  return newStatus;
};

export const checkFinancialClearance = async (studentId: number): Promise<boolean> => {
  const student = await prisma.student.findUnique({
    where: { studentid: studentId },
    select: { financialstatus: true }
  });

  return student?.financialstatus === 'CLEARED';
};
