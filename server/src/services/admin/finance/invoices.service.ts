import prisma from '../../../config/prisma.js';
import { generateInvoiceForSemester } from '../../finance/invoice.service.js';

export const getAllInvoices = async () => {
  return await prisma.studentinvoice.findMany({
    include: {
      student: {
        select: {
          studentid: true,
          rollnumber: true,
          fullname: true,
          user: {
            select: {
              username: true
            }
          }
        }
      },
      semester: {
        select: {
          semesterid: true,
          name: true
        }
      },
      items: true
    },
    orderBy: { invoiceid: 'desc' }
  });
};

export const generateInvoice = async (data: {
  studentId: number;
  semesterId: number;
  enrolledCredits?: number;
}) => {
  let enrolledCredits = data.enrolledCredits;
  if (!enrolledCredits || enrolledCredits <= 0) {
    const enrollments = await prisma.courseenrollment.findMany({
      where: {
        studentid: data.studentId,
        courseoffering: { semesterid: data.semesterId },
        isactive: true
      },
      include: {
        courseoffering: {
          include: {
            course: true
          }
        }
      }
    });

    enrolledCredits = enrollments.reduce((sum, en) => {
      return sum + (en.courseoffering?.course?.credits || 3);
    }, 0);

    if (enrolledCredits === 0) enrolledCredits = 12; // Fallback credits load
  }

  return await generateInvoiceForSemester(data.studentId, data.semesterId, enrolledCredits);
};
