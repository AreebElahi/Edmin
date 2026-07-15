import prisma from '../../config/prisma.js';
import { Prisma } from '@prisma/client';

export interface AssignSectionOptions {
  studentId: number;
  programId?: number;
  semesterId?: number;
  departmentId?: number; // fallback
  preferredSectionId?: number;
}

export const assignSectionToStudent = async (options: AssignSectionOptions) => {
  const { studentId, departmentId, programId, semesterId, preferredSectionId } = options;

  return await prisma.$transaction(async (tx) => {
    // Check if preferred section has space first, otherwise find any active section
    let targetSectionId: number | null = null;

    if (preferredSectionId) {
      const preferred = await tx.section.findUnique({
        where: { sectionid: preferredSectionId }
      });
      if (preferred && preferred.status === 'ACTIVE' && preferred.isactive) {
        const count = await tx.student.count({
          where: { sectionid: preferred.sectionid }
        });
        if (count < preferred.capacity) {
          targetSectionId = preferred.sectionid;
        }
      }
    }

    if (!targetSectionId) {
      // Find all active sections for the program and semester
      const sections = await tx.section.findMany({
        where: { 
          ...(programId ? { programid: programId } : {}),
          ...(semesterId ? { semesterid: semesterId } : {}),
          ...(departmentId ? { departmentid: departmentId } : {}),
          status: 'ACTIVE',
          isactive: true
        },
        orderBy: { section_sequence: 'asc' }
      });

      for (const section of sections) {
        const count = await tx.student.count({
          where: { sectionid: section.sectionid }
        });
        if (count < section.capacity) {
          targetSectionId = section.sectionid;
          break;
        }
      }
    }

    if (targetSectionId) {
      // Assign the student to the section
      const student = await tx.student.update({
        where: { studentid: studentId },
        data: { 
          sectionid: targetSectionId,
          status: 'ACTIVE',
          waitlistposition: null
        }
      });
      
      // Optional: Check if section is now full and update its status
      const newCount = await tx.student.count({
        where: { sectionid: targetSectionId }
      });
      const section = await tx.section.findUnique({ where: { sectionid: targetSectionId } });
      if (section && newCount >= section.capacity) {
        await tx.section.update({
          where: { sectionid: targetSectionId },
          data: { status: 'FULL' }
        });
      }

      return student;
    } else {
      // Find current max waitlist position for this program/semester
      const lastWaitlisted = await tx.student.findFirst({
        where: { 
          status: 'WAITLISTED',
          programid: programId,
          semesterid: semesterId
        },
        orderBy: { waitlistposition: 'desc' }
      });
      const nextPosition = (lastWaitlisted?.waitlistposition || 0) + 1;

      // No available section, mark as pending
      const student = await tx.student.update({
        where: { studentid: studentId },
        data: { 
          sectionid: null,
          status: 'WAITLISTED',
          waitlistposition: nextPosition
        }
      });
      return student;
    }
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable
  });
};

export const batchAssignStudents = async (studentIds: number[], departmentId: number, programId?: number, semesterId?: number) => {
  const results = [];
  // For bulk imports, we process sequentially in transactions to ensure accurate counts and locks
  // If performance becomes an issue, we can optimize by bulk querying sections and assigning in memory before a bulk update, but sequential transactions are safer.
  for (const studentId of studentIds) {
    try {
      const student = await assignSectionToStudent({ studentId, departmentId, programId, semesterId });
      results.push({ studentId, success: true, status: student.status, sectionid: student.sectionid });
    } catch (error: any) {
      results.push({ studentId, success: false, error: error.message });
    }
  }
  return results;
};

export const moveStudentToSection = async (studentId: number, targetSectionId: number) => {
  return await prisma.$transaction(async (tx) => {
    const student = await tx.student.findUnique({ where: { studentid: studentId } });
    if (!student) throw new Error('Student not found');
    
    const targetSection = await tx.section.findUnique({ where: { sectionid: targetSectionId } });
    if (!targetSection) throw new Error('Target section not found');

    const count = await tx.student.count({ where: { sectionid: targetSectionId } });
    if (count >= targetSection.capacity) {
      throw new Error('Target section is full');
    }

    const previousSectionId = student.sectionid;

    const updatedStudent = await tx.student.update({
      where: { studentid: studentId },
      data: { sectionid: targetSectionId, status: 'ACTIVE' }
    });

    // Update new section status if full
    if (count + 1 >= targetSection.capacity) {
      await tx.section.update({
        where: { sectionid: targetSectionId },
        data: { status: 'FULL' }
      });
    }

    // Update old section status if it was full
    if (previousSectionId && previousSectionId !== targetSectionId) {
      const oldSection = await tx.section.findUnique({ where: { sectionid: previousSectionId } });
      if (oldSection && oldSection.status === 'FULL') {
        // Technically it might have capacity now
        await tx.section.update({
          where: { sectionid: previousSectionId },
          data: { status: 'ACTIVE' }
        });
      }
    }

    return updatedStudent;
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable
  });
};

export const generateNewSection = async (programId: number, semesterId: number) => {
  return await prisma.$transaction(async (tx) => {
    const program = await tx.program.findUnique({ where: { programid: programId } });
    if (!program) throw new Error('Program not found');

    const lastSection = await tx.section.findFirst({
      where: { programid: programId, semesterid: semesterId },
      orderBy: { section_sequence: 'desc' }
    });

    const nextSequence = (lastSection?.section_sequence || 0) + 1;
    // Basic naming: e.g. "SE-A", "SE-B", ...
    const letter = String.fromCharCode(64 + nextSequence); // 1->A, 2->B. Beyond 26 requires custom logic.
    const sectionName = `${program.code}-${letter}`;

    const newSection = await tx.section.create({
      data: {
        name: sectionName,
        departmentid: program.departmentid,
        programid: programId,
        semesterid: semesterId,
        section_sequence: nextSequence,
        capacity: 50,
        status: 'ACTIVE',
        isactive: true
      }
    });

    return newSection;
  });
};

export const reassignPendingStudents = async () => {
  const pendingStudents = await prisma.student.findMany({
    where: { status: 'WAITLISTED' },
    orderBy: { waitlistposition: 'asc' }
  });

  const results = [];
  for (const student of pendingStudents) {
    if (student.departmentid) {
      try {
        const updated = await assignSectionToStudent({ 
          studentId: student.studentid, 
          departmentId: student.departmentid || undefined,
          programId: student.programid || undefined,
          semesterId: student.semesterid || undefined
        });
        results.push({ studentId: student.studentid, success: true, status: updated.status, sectionid: updated.sectionid });
      } catch (error: any) {
        results.push({ studentId: student.studentid, success: false, error: error.message });
      }
    }
  }
  return results;
};
