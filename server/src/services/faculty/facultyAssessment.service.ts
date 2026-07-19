import { eventBus, Events } from '../../events/eventBus.js';
import prisma from '../../config/prisma.js';

export const createAssignment = async (userId: number, courseOfferingId: string, title: string, maxMarks: string, dueDate: string) => {
  const faculty = await prisma.faculty.findFirst({ where: { userid: userId, isactive: true } });
  if (!faculty) throw new Error('Faculty profile not found');

  const offering = await prisma.courseoffering.findFirst({
    where: {
      courseofferingid: parseInt(courseOfferingId),
      OR: [ { facultyid: faculty.facultyid }, { instructorid: faculty.facultyid } ],
      isactive: true,
    }
  });

  if (!offering) throw new Error('Unauthorized course offering');

  const assignment = await prisma.assignment.create({
    data: {
      courseofferingid: offering.courseofferingid,
      title,
      maxmarks: parseFloat(maxMarks),
      duedate: new Date(dueDate),
    }
  });

  // Emit event for notifications
  eventBus.emit(Events.ASSIGNMENT_CREATED, {
    assignmentId: assignment.assignmentid,
    courseOfferingId: offering.courseofferingid,
    title: assignment.title
  });

  return assignment;
};

export const updateAssignment = async (userId: number, id: string, title: string, maxMarks: string, dueDate: string) => {
  const faculty = await prisma.faculty.findFirst({ where: { userid: userId, isactive: true } });
  if (!faculty) throw new Error('Faculty profile not found');

  const assignment = await prisma.assignment.findFirst({
    where: {
      assignmentid: parseInt(id),
      courseoffering: {
        OR: [ { facultyid: faculty.facultyid }, { instructorid: faculty.facultyid } ],
        isactive: true,
      }
    }
  });

  if (!assignment) throw new Error('Unauthorized or not found');

  return await prisma.assignment.update({
    where: { assignmentid: assignment.assignmentid },
    data: {
      title,
      maxmarks: parseFloat(maxMarks),
      duedate: new Date(dueDate),
    }
  });
};

export const getAssignments = async (userId: number) => {
  const faculty = await prisma.faculty.findFirst({
    where: { userid: userId, isactive: true },
  });

  if (!faculty) throw new Error('Faculty profile not found');

  const assignments = await prisma.assignment.findMany({
    where: {
      courseoffering: {
        OR: [
          { facultyid: faculty.facultyid },
          { instructorid: faculty.facultyid },
        ],
        isactive: true,
      },
      isactive: true,
    },
    include: {
      courseoffering: { 
        include: { 
          course: true,
          _count: { select: { courseenrollment: { where: { isactive: true } } } }
        } 
      },
      assignmentsubmission: {
        where: { isactive: true },
        select: { status: true }
      }
    },
    orderBy: { createdat: 'desc' },
  });

  return assignments.map(a => ({
    id: a.assignmentid.toString(),
    title: a.title,
    courseOfferingId: a.courseofferingid.toString(),
    code: a.courseoffering.course.code,
    courseName: a.courseoffering.course.name,
    dueDate: new Date(a.duedate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    status: new Date(a.duedate) > new Date() ? 'Active' : 'Closed',
    submissions: a.assignmentsubmission.length,
    totalStudents: a.courseoffering._count.courseenrollment,
    gradedSubmissions: a.assignmentsubmission.filter((s: any) => s.status === 'GRADED').length,
    points: a.maxmarks ?? 100,
    description: 'Manage submissions and grades for this assignment.',
  }));
};

export const deleteAssignment = async (userId: number, id: string) => {
  const faculty = await prisma.faculty.findFirst({ where: { userid: userId, isactive: true } });
  if (!faculty) throw new Error('Faculty profile not found');

  const assignment = await prisma.assignment.findFirst({
    where: {
      assignmentid: parseInt(id),
      courseoffering: {
        OR: [ { facultyid: faculty.facultyid }, { instructorid: faculty.facultyid } ]
      }
    }
  });

  if (!assignment) throw new Error('Unauthorized or not found');

  await prisma.assignment.update({
    where: { assignmentid: assignment.assignmentid },
    data: { isactive: false, deletedat: new Date() }
  });
  return { message: 'Assignment deleted' };
};

export const getQuizzes = async (userId: number) => {
  const faculty = await prisma.faculty.findFirst({
    where: { userid: userId, isactive: true },
  });

  if (!faculty) throw new Error('Faculty profile not found');

  const courseCondition = {
    OR: [
      { facultyid: faculty.facultyid },
      { instructorid: faculty.facultyid },
    ],
    isactive: true,
  };

  const [quizzes, aiquizzes] = await Promise.all([
    prisma.quiz.findMany({
      where: { courseoffering: courseCondition, isactive: true },
      include: {
        courseoffering: { include: { course: true } },
        _count: { select: { quizattempt: { where: { isactive: true } } } },
      },
      orderBy: { createdat: 'desc' },
    }),
    prisma.aiquiz.findMany({
      where: { facultyid: faculty.facultyid, isactive: true },
      include: {
        courseoffering: { include: { course: true } },
        _count: { select: { attempts: { where: { status: 'SUBMITTED' } } } },
      },
      orderBy: { createdat: 'desc' },
    })
  ]);

  return [
    ...quizzes.map(q => ({
      id: q.quizid.toString(),
      title: q.title,
      courseId: q.courseoffering.course.code,
      courseName: q.courseoffering.course.name,
      duration: q.duration,
      status: q.isactive ? 'Published' : 'Draft',
      totalMarks: q.totalmarks,
      totalAttempts: q._count.quizattempt,
      isAi: false,
    })),
    ...aiquizzes.map(q => ({
      id: q.aiquizid.toString(),
      title: q.title,
      courseId: q.courseoffering?.course.code || 'N/A',
      courseName: q.courseoffering?.course.name || 'N/A',
      duration: q.timelimitminutes,
      status: q.status === 'PUBLISHED' ? 'Published' : 'Draft',
      totalMarks: q.questioncount,
      totalAttempts: q._count.attempts,
      isAi: true,
    }))
  ];
};

export const deleteQuiz = async (userId: number, id: string, isAi: any) => {
  const faculty = await prisma.faculty.findFirst({ where: { userid: userId, isactive: true } });
  if (!faculty) throw new Error('Faculty profile not found');

  if (isAi === 'true') {
    const quiz = await prisma.aiquiz.findFirst({
      where: {
        aiquizid: parseInt(id),
        courseoffering: {
          OR: [ { facultyid: faculty.facultyid }, { instructorid: faculty.facultyid } ]
        }
      }
    });
    if (!quiz) throw new Error('Unauthorized or not found');

    await prisma.aiquiz.update({
      where: { aiquizid: quiz.aiquizid },
      data: { isactive: false, deletedat: new Date() }
    });
  } else {
    const quiz = await prisma.quiz.findFirst({
      where: {
        quizid: parseInt(id),
        courseoffering: {
          OR: [ { facultyid: faculty.facultyid }, { instructorid: faculty.facultyid } ]
        }
      }
    });
    if (!quiz) throw new Error('Unauthorized or not found');

    await prisma.quiz.update({
      where: { quizid: quiz.quizid },
      data: { isactive: false, deletedat: new Date() }
    });
  }
  return { message: 'Quiz deleted' };
};

export const createQuiz = async (userId: number, courseOfferingId: string, title: string, duration: string, totalMarks: string) => {
  const faculty = await prisma.faculty.findFirst({ where: { userid: userId, isactive: true } });
  if (!faculty) throw new Error('Faculty profile not found');

  const offering = await prisma.courseoffering.findFirst({
    where: {
      courseofferingid: parseInt(courseOfferingId),
      OR: [ { facultyid: faculty.facultyid }, { instructorid: faculty.facultyid } ],
      isactive: true,
    }
  });

  if (!offering) throw new Error('Unauthorized course offering');

  return await prisma.quiz.create({
    data: {
      courseofferingid: offering.courseofferingid,
      title,
      duration: parseInt(duration),
      totalmarks: parseFloat(totalMarks),
    }
  });
};

export const grantReattempt = async (userId: number, quizId: string, studentId: string, reason: string, isAi: boolean) => {
  const faculty = await prisma.faculty.findFirst({ where: { userid: userId, isactive: true } });
  if (!faculty) throw new Error('Faculty profile not found');

  if (isAi) {
    const quiz = await prisma.aiquiz.findFirst({
      where: {
        aiquizid: parseInt(quizId),
        courseoffering: {
          OR: [ { facultyid: faculty.facultyid }, { instructorid: faculty.facultyid } ]
        }
      }
    });
    if (!quiz) throw new Error('Unauthorized or not found');

    return await prisma.aiquizreattemptgrant.create({
      data: {
        aiquizid: quiz.aiquizid,
        studentid: parseInt(studentId),
        grantedby: faculty.facultyid,
        reason,
      }
    });
  } else {
    const quiz = await prisma.quiz.findFirst({
      where: {
        quizid: parseInt(quizId),
        courseoffering: {
          OR: [ { facultyid: faculty.facultyid }, { instructorid: faculty.facultyid } ]
        }
      }
    });
    if (!quiz) throw new Error('Unauthorized or not found');

    await prisma.quizattempt.updateMany({
      where: {
        quizid: quiz.quizid,
        studentid: parseInt(studentId),
      },
      data: {
        isactive: false,
        deletedat: new Date()
      }
    });

    return { message: 'Reattempt granted for standard quiz (attempts reset)' };
  }
};

export const getQuizDetails = async (userId: number, quizId: string) => {
  const faculty = await prisma.faculty.findFirst({
    where: { userid: userId, isactive: true },
  });

  if (!faculty) throw new Error('Faculty profile not found');

  const courseCondition = {
    OR: [
      { facultyid: faculty.facultyid },
      { instructorid: faculty.facultyid },
    ],
    isactive: true,
  };

  // Try standard quiz first
  const quiz = await prisma.quiz.findFirst({
    where: { quizid: parseInt(quizId), courseoffering: courseCondition, isactive: true },
    include: {
      courseoffering: { include: { course: true } },
      quizattempt: { 
        where: { isactive: true },
        include: { student: { include: { user: true } } }
      }
    }
  });

  if (quiz) {
    return {
      id: quiz.quizid.toString(),
      title: quiz.title,
      courseId: quiz.courseoffering.course.code,
      courseName: quiz.courseoffering.course.name,
      duration: quiz.duration,
      status: quiz.isactive ? 'Published' : 'Draft',
      totalMarks: quiz.totalmarks,
      totalAttempts: quiz.quizattempt.length,
      isAi: false,
      attempts: quiz.quizattempt.map(a => ({
        id: a.quizattemptid.toString(),
        studentId: a.student.rollnumber || 'N/A',
        name: a.student.fullname || a.student.user.username,
        status: 'Completed',
        attemptDate: a.createdat,
        score: a.score,
        attempted: true
      }))
    };
  }

  // Try AI quiz
  const aiquiz = await prisma.aiquiz.findFirst({
    where: { aiquizid: parseInt(quizId), facultyid: faculty.facultyid, isactive: true },
    include: {
      courseoffering: { include: { course: true } },
      attempts: { 
        where: { status: 'SUBMITTED' },
        include: { student: { include: { user: true } } }
      }
    }
  });

  if (aiquiz) {
    return {
      id: aiquiz.aiquizid.toString(),
      title: aiquiz.title,
      courseId: aiquiz.courseoffering?.course.code || 'N/A',
      courseName: aiquiz.courseoffering?.course.name || 'N/A',
      duration: aiquiz.timelimitminutes,
      status: aiquiz.status === 'PUBLISHED' ? 'Published' : 'Draft',
      totalMarks: aiquiz.questioncount,
      totalAttempts: aiquiz.attempts.length,
      isAi: true,
      attempts: aiquiz.attempts.map(a => ({
        id: a.aiquizattemptid.toString(),
        studentId: a.student.rollnumber || 'N/A',
        name: a.student.fullname || a.student.user.username,
        status: 'Completed',
        attemptDate: a.submittedat || a.createdat,
        score: a.score,
        attempted: true
      }))
    };
  }

  throw new Error('Quiz not found');
};

export const getAssignmentSubmissions = async (userId: number, assignmentId: number) => {
  const faculty = await prisma.faculty.findFirst({ where: { userid: userId, isactive: true } });
  if (!faculty) throw new Error('Faculty profile not found');

  const assignment = await prisma.assignment.findFirst({
    where: {
      assignmentid: assignmentId,
      courseoffering: {
        OR: [ { facultyid: faculty.facultyid }, { instructorid: faculty.facultyid } ],
        isactive: true,
      },
      isactive: true,
    },
    include: {
      courseoffering: {
        include: {
          courseenrollment: {
            where: { isactive: true },
            include: {
              student: {
                include: {
                  user: true
                }
              }
            }
          }
        }
      },
      assignmentsubmission: {
        where: { isactive: true },
        include: {
          peerreview: {
            where: { reviewerid: userId, isactive: true }
          }
        }
      }
    }
  });

  if (!assignment) throw new Error('Assignment not found or unauthorized');

  const enrolledStudents = assignment.courseoffering.courseenrollment.map(enrollment => {
    const student = enrollment.student;
    const submission = assignment.assignmentsubmission.find(s => s.studentid === student.studentid);
    const gradeRecord = submission?.peerreview?.[0];
    
    return {
      id: student.studentid.toString(),
      studentId: student.rollnumber || `ST-${student.studentid}`,
      name: student.fullname || student.user.username,
      status: submission 
        ? (submission.status === 'GRADED' ? 'Graded' : 'Submitted')
        : 'Pending',
      submittedDate: submission?.createdat || null,
      grade: gradeRecord ? (gradeRecord.score ?? null) : null,
      feedback: gradeRecord ? (gradeRecord.feedback ?? '') : '',
      submissionId: submission?.assignmentsubmissionid || null,
      downloadUrl: submission 
        ? `/storage/assignments/${assignmentId}/submissions/${submission.assignmentsubmissionid}/download`
        : null
    };
  });

  return enrolledStudents;
};

export const gradeAssignmentSubmission = async (
  userId: number,
  assignmentId: number,
  studentId: number,
  obtainedMarks: number,
  remarks: string
) => {
  const faculty = await prisma.faculty.findFirst({ where: { userid: userId, isactive: true } });
  if (!faculty) throw new Error('Faculty profile not found');

  const student = await prisma.student.findUnique({
    where: { studentid: studentId }
  });
  if (!student) throw new Error('Student not found');

  // Verify faculty teaches this assignment's course offering
  const assignment = await prisma.assignment.findFirst({
    where: {
      assignmentid: assignmentId,
      courseoffering: {
        OR: [ { facultyid: faculty.facultyid }, { instructorid: faculty.facultyid } ],
        isactive: true
      },
      isactive: true
    }
  });

  if (!assignment) throw new Error('Assignment not found or unauthorized');

  // Find or create assignmentsubmission for this student
  let submission = await prisma.assignmentsubmission.findFirst({
    where: {
      assignmentid: assignmentId,
      studentid: studentId,
      isactive: true
    }
  });

  if (!submission) {
    submission = await prisma.assignmentsubmission.create({
      data: {
        assignmentid: assignmentId,
        studentid: studentId,
        status: 'GRADED',
        isactive: true
      }
    });
  }

  // Find existing peerreview or create a new one
  const existingReview = await prisma.peerreview.findFirst({
    where: {
      submissionid: submission.assignmentsubmissionid,
      reviewerid: userId,
      isactive: true
    }
  });

  if (existingReview) {
    await prisma.peerreview.update({
      where: { peerreviewid: existingReview.peerreviewid },
      data: {
        score: obtainedMarks,
        feedback: remarks,
        updatedat: new Date()
      }
    });
  } else {
    await prisma.peerreview.create({
      data: {
        submissionid: submission.assignmentsubmissionid,
        assignmentsubmissionid: submission.assignmentsubmissionid,
        reviewerid: userId,
        score: obtainedMarks,
        feedback: remarks,
        userid: student.userid,
        isactive: true
      }
    });
  }

  // Ensure submission status is updated to GRADED
  await prisma.assignmentsubmission.update({
    where: { assignmentsubmissionid: submission.assignmentsubmissionid },
    data: {
      status: 'GRADED',
      updatedat: new Date()
    }
  });

  return { success: true };
};


