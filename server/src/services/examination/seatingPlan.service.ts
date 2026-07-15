import prisma from '../../config/prisma.js';
import { checkFinancialClearance } from '../finance/financialClearance.service.js';

export const generateSeatingPlan = async (examSessionId: number) => {
  const exam = await prisma.examsession.findUnique({
    where: { examsessionid: examSessionId },
    include: { room: true, assessment: true }
  });

  if (!exam) throw new Error('Exam session not found');

  const roomCapacity = exam.room.capacity;

  // Fetch all students enrolled in this section's offering
  const enrollments = await prisma.courseenrollment.findMany({
    where: {
      courseofferingid: exam.assessment.offeringid,
      status: 'ENROLLED',
      student: {
        sectionid: exam.sectionid
      }
    },
    include: {
      student: {
        include: { user: true }
      }
    }
  });

  if (enrollments.length > roomCapacity) {
    throw new Error(`Room capacity exceeded! Room ${exam.room.name} has ${roomCapacity} seats but ${enrollments.length} students are enrolled.`);
  }

  // Sort alphabetically by student registration number or username
  // Assuming user.username represents the registration number (e.g. FA21-BCS-001)
  enrollments.sort((a, b) => a.student.user.username.localeCompare(b.student.user.username));

  // We assign linear seat numbers A-1, A-2... for simplicity, based on simple modulo logic
  let seatAssignedCount = 0;
  for (let i = 0; i < enrollments.length; i++) {
    const student = enrollments[i].student;
    
    const isCleared = await checkFinancialClearance(student.studentid);
    if (!isCleared) {
      console.warn(`Student ${student.studentid} is not financially cleared. Seating allocation skipped.`);
      continue;
    }

    const row = String.fromCharCode(65 + Math.floor(i / 10)); // A, B, C... (10 per row)
    const seatNum = (i % 10) + 1;
    const seatString = `Row-${row}-${seatNum}`;

    // Upsert the examattendance record to assign the seat
    await prisma.examattendance.upsert({
      where: {
        examsessionid_studentid: {
          examsessionid: examSessionId,
          studentid: student.studentid
        }
      },
      update: {
        seatnumber: seatString
      },
      create: {
        examsessionid: examSessionId,
        studentid: student.studentid,
        seatnumber: seatString,
        status: 'PRESENT' // Default status before exam starts
      }
    });

    seatAssignedCount++;
  }

  return { message: `Successfully allocated seats for ${seatAssignedCount} students.` };
};
