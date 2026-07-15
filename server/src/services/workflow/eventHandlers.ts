import { createNotification } from '../notification/notification.service.js';
import prisma from '../../config/prisma.js';

type EventHandler = (payload: any) => Promise<void>;

const handleGradesPublished: EventHandler = async (payload) => {
  const { examSessionId, studentId, courseName } = payload;
  
  // We need the userid of the student
  const student = await prisma.student.findUnique({ where: { studentid: studentId } });
  if (!student) return;

  await createNotification({
    userId: student.userid,
    title: 'Grades Published',
    message: `Your grades for ${courseName || 'a recent exam'} have been published.`,
    type: 'ACADEMIC',
    actionUrl: `/dashboard/student/results`,
    metadata: { examSessionId, studentId }
  });
};

const handleInvoiceGenerated: EventHandler = async (payload) => {
  const { invoiceId, studentId, totalAmount, dueDate } = payload;

  const student = await prisma.student.findUnique({ where: { studentid: studentId } });
  if (!student) return;

  await createNotification({
    userId: student.userid,
    title: 'New Invoice Generated',
    message: `An invoice for $${totalAmount} has been generated. Due by ${new Date(dueDate).toLocaleDateString()}.`,
    type: 'FINANCE',
    actionUrl: `/dashboard/student/finance/invoices/${invoiceId}`,
    metadata: { invoiceId, studentId }
  });
};

const handlePaymentReceived: EventHandler = async (payload) => {
  const { paymentId, invoiceId, studentId, amount } = payload;

  const student = await prisma.student.findUnique({ where: { studentid: studentId } });
  if (!student) return;

  await createNotification({
    userId: student.userid,
    title: 'Payment Received',
    message: `We have received your payment of $${amount} for Invoice #${invoiceId}. Thank you!`,
    type: 'FINANCE',
    actionUrl: `/dashboard/student/finance/payments/${paymentId}`,
    metadata: { paymentId, invoiceId, studentId }
  });
};

import { generateInvoiceForSemester } from '../finance/invoice.service.js';

const handleStudentEnrolled: EventHandler = async (payload) => {
  const { studentId, semesterId, enrolledCredits } = payload;
  await generateInvoiceForSemester(studentId, semesterId, enrolledCredits);
};

import { recalculateDegreeAudit } from '../academic/degreeAudit.service.js';

const handleCourseCompleted: EventHandler = async (payload) => {
  const { studentId } = payload;
  await recalculateDegreeAudit(studentId);
};

export const eventHandlers: Record<string, EventHandler> = {
  'GRADES_PUBLISHED': handleGradesPublished,
  'INVOICE_GENERATED': handleInvoiceGenerated,
  'PAYMENT_RECEIVED': handlePaymentReceived,
  'STUDENT_ENROLLED': handleStudentEnrolled,
  'COURSE_COMPLETED': handleCourseCompleted
};
