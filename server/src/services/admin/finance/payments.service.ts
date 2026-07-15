import prisma from '../../../config/prisma.js';
import { processPayment } from '../../finance/payment.service.js';

export const getAllPayments = async () => {
  return await prisma.payment.findMany({
    include: {
      invoice: {
        select: {
          invoiceid: true,
          totalamount: true,
          amountpaid: true,
          status: true,
          student: {
            select: {
              rollnumber: true,
              fullname: true,
              user: {
                select: {
                  username: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: { paymentid: 'desc' }
  });
};

export const recordPayment = async (data: {
  invoiceId: number;
  amount: number;
  method: 'CASH' | 'BANK' | 'CARD' | 'ONLINE';
  transactionRef?: string;
}) => {
  return await processPayment(data.invoiceId, data.amount, data.method, data.transactionRef);
};
