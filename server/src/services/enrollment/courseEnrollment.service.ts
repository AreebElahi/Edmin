import prisma from '../../config/prisma.js';
import { checkFinancialClearance } from '../finance/financialClearance.service.js';
import { publishEvent } from '../workflow/eventPublisher.service.js';
export const enrollStudentInCourse = async (studentId: number, offeringId: number) => {
  // 0. Financial Lock
  const isCleared = await checkFinancialClearance(studentId);
  if (!isCleared) {
    throw new Error("Financial Clearance required. Registration is BLOCKED or HOLD.");
  }

  // We'll assume validation happened in registrationRules.service
  return await prisma.$transaction(async (tx) => {
    // Check capacity
    const offering = await tx.courseoffering.findUnique({
      where: { courseofferingid: offeringId },
      include: {
        _count: {
          select: { courseenrollment: true }
        }
      }
    });

    if (!offering) throw new Error("Course offering not found");
    if (offering.status !== 'ACTIVE') throw new Error("Course offering is not active");
    if (offering._count.courseenrollment >= offering.capacity) throw new Error("Course offering is full");

    return await tx.courseenrollment.create({
      data: {
        studentid: studentId,
        courseofferingid: offeringId,
        status: 'ENROLLED'
      }
    });
  });
};

export const dropCourse = async (enrollmentId: number) => {
  return await prisma.courseenrollment.update({
    where: { courseenrollmentid: enrollmentId },
    data: { status: 'DROPPED' }
  });
};

export const withdrawCourse = async (enrollmentId: number) => {
  return await prisma.courseenrollment.update({
    where: { courseenrollmentid: enrollmentId },
    data: { status: 'WITHDRAWN' }
  });
};

export const completeCourse = async (enrollmentId: number, grade: string, gradePoints: number) => {
  return await prisma.courseenrollment.update({
    where: { courseenrollmentid: enrollmentId },
    data: {
      status: 'COMPLETED',
      grade,
      gradepoints: gradePoints,
      completedat: new Date()
    }
  });
};


export const confirmSemesterRegistration = async (studentId: number, semesterId: number) => {
  // Get all enrolled courses for this semester
  const enrollments = await prisma.courseenrollment.findMany({
    where: { 
      studentid: studentId,
      status: 'ENROLLED',
      courseoffering: { semesterid: semesterId }
    },
    include: { courseoffering: { include: { course: true } } }
  });

  if (enrollments.length === 0) {
    throw new Error('No enrolled courses found to confirm');
  }

  const enrolledCredits = enrollments.reduce((acc, e) => acc + e.courseoffering.course.credits, 0);

  // Validate that student actually exists and has a programid (required by invoice generation)
  const student = await prisma.student.findUnique({
    where: { studentid: studentId },
    select: { programid: true }
  });

  if (!student || !student.programid) {
    throw new Error('Student must exist and be assigned to a program before confirming registration');
  }

  // Wrap the invoice creation and outbox event emission in a single transaction
  // to prevent race conditions or orphaned events if the DB write fails.
  const invoice = await prisma.$transaction(async (tx) => {
    // Synchronously create the invoice in PROCESSING state to guarantee visibility
    const inv = await tx.studentinvoice.upsert({
      where: {
        studentid_semesterid: {
          studentid: studentId,
          semesterid: semesterId
        }
      },
      update: {
        status: 'PROCESSING'
      },
      create: {
        studentid: studentId,
        semesterid: semesterId,
        totalamount: 0,
        duedate: new Date(),
        status: 'PROCESSING'
      }
    });

    // Emit event for async generation using the transactional outbox publisher
    await publishEvent(tx, 'invoice', inv.invoiceid, 'STUDENT_ENROLLED', {
      studentId,
      semesterId,
      enrolledCredits
    });

    return inv;
  });

  return invoice;
};
