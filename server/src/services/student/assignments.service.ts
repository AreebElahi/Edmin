import { findStudentIdOnly } from '../../models/student/profile.model.js';
import {
  findAssignmentsByStudent,
  findAssignmentById,
  findSubmissionByStudentAndAssignment,
  upsertAssignmentSubmission,
} from '../../models/student/assignments.model.js';
import { AppError } from '../../utils/AppError.js';
import prisma from '../../config/prisma.js';

const getStudentId = async (userId: number): Promise<number> => {
  const student = await findStudentIdOnly(userId);
  if (!student) {
    throw new AppError(404, 'Student profile not found');
  }
  return student.studentid;
};

export const getAssignmentsWithStatus = async (userId: number) => {
  const assignments = await findAssignmentsByStudent(userId);
  const now = new Date();

  return assignments.map((a) => {
    const submission = a.assignmentsubmission[0] ?? null;
    const isOverdue = new Date(a.duedate) < now;

    let status: 'pending' | 'submitted' | 'graded' | 'overdue' = 'pending';
    if (submission) {
      if (submission.status === 'GRADED') status = 'graded';
      else status = 'submitted';
    } else if (isOverdue) {
      status = 'overdue';
    }

    return {
      assignmentId: a.assignmentid,
      title: a.title,
      duedate: a.duedate,
      maxmarks: a.maxmarks,
      course: {
        code: a.courseoffering.course.code,
        name: a.courseoffering.course.name,
      },
      status,
      submission: submission
        ? {
            submissionId: submission.assignmentsubmissionid,
            status: submission.status,
            submittedAt: submission.createdat,
            downloadUrl: `/api/v1/storage/assignments/${a.assignmentid}/submissions/${submission.assignmentsubmissionid}/download`
          }
        : null,
    };
  });
};

export const getAssignmentDetail = async (userId: number, assignmentId: number) => {
  const [assignment, isEnrolled, submission] = await Promise.all([
    findAssignmentById(assignmentId),
    prisma.courseenrollment.findFirst({
      where: {
        student: { userid: userId },
        courseoffering: { assignment: { some: { assignmentid: assignmentId } } },
        isactive: true,
      },
    }),
    prisma.assignmentsubmission.findFirst({
      where: {
        student: { userid: userId },
        assignmentid: assignmentId,
        isactive: true,
      },
    }),
  ]);

  if (!assignment) throw new AppError(404, 'Assignment not found');
  if (!isEnrolled) throw new AppError(403, 'Forbidden: You are not enrolled in this course offering');

  return {
    assignmentId: assignment.assignmentid,
    title: assignment.title,
    duedate: assignment.duedate,
    maxmarks: assignment.maxmarks,
    course: {
      code: assignment.courseoffering.course.code,
      name: assignment.courseoffering.course.name,
    },
    submission: submission
      ? {
          submissionId: submission.assignmentsubmissionid,
          status: submission.status,
          submittedAt: submission.createdat,
          downloadUrl: `/api/v1/storage/assignments/${assignmentId}/submissions/${submission.assignmentsubmissionid}/download`
        }
      : null,
  };
};

export const submitAssignment = async (userId: number, assignmentId: number, fileUrl: string) => {
  const [student, assignment, isEnrolled] = await Promise.all([
    prisma.student.findFirst({ where: { userid: userId }, select: { studentid: true } }),
    findAssignmentById(assignmentId),
    prisma.courseenrollment.findFirst({
      where: {
        student: { userid: userId },
        courseoffering: { assignment: { some: { assignmentid: assignmentId } } },
        isactive: true,
      },
    }),
  ]);

  if (!student) throw new AppError(404, 'Student profile not found');
  if (!assignment) throw new AppError(404, 'Assignment not found');
  if (!isEnrolled) throw new AppError(403, 'Forbidden: You are not enrolled in this course offering');

  if (new Date() >= assignment.duedate) {
    throw new AppError(403, 'Forbidden: Cannot submit past the assignment deadline');
  }

  const result = await upsertAssignmentSubmission(student.studentid, assignmentId, fileUrl);
  return result;
};

export const unsubmitAssignment = async (userId: number, assignmentId: number) => {
  const [student, assignment] = await Promise.all([
    prisma.student.findFirst({ where: { userid: userId }, select: { studentid: true } }),
    findAssignmentById(assignmentId)
  ]);

  if (!student) throw new AppError(404, 'Student profile not found');
  if (!assignment) throw new AppError(404, 'Assignment not found');

  if (new Date() >= assignment.duedate) {
    throw new AppError(403, 'Forbidden: Cannot un-submit past the assignment deadline');
  }

  const existing = await prisma.assignmentsubmission.findFirst({
    where: { studentid: student.studentid, assignmentid: assignmentId, isactive: true },
  });

  if (!existing) throw new AppError(404, 'Submission not found');

  await prisma.assignmentsubmission.update({
    where: { assignmentsubmissionid: existing.assignmentsubmissionid },
    data: { isactive: false, updatedat: new Date() }
  });

  return existing.fileUrl;
};
