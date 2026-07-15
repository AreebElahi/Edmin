import prisma from '../../config/prisma.js';
import { AppError } from '../../utils/AppError.js';

export const getEnrolledCourses = async (userId: number) => {
  const enrollments = await prisma.courseenrollment.findMany({
    where: { student: { userid: userId }, isactive: true },
    include: {
      courseoffering: {
        include: {
          course: true,
          semester: true,
          faculty: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  return enrollments.map((e) => {
    const offering = e.courseoffering;
    const instructorName = offering.faculty 
      ? (offering.faculty.fullname || offering.faculty.user.username)
      : 'TBD';

    return {
      courseEnrollmentId: e.courseenrollmentid,
      courseOfferingId: offering.courseofferingid,
      courseId: offering.course.courseid,
      code: offering.course.code,
      name: offering.course.name,
      credits: offering.course.credits,
      semester: offering.semester.name,
      instructor: instructorName,
      status: e.status,
      grade: e.grade || 'N/A',
      gradepoints: e.gradepoints,
      percentage: e.percentage,
      // Statically mapping mode since it's not in DB schema, but we want premium feel
      mode: offering.capacity > 25 ? 'Face-to-Face' : 'Hybrid',
    };
  });
};

export const getCourseDetail = async (userId: number, courseOfferingId: number) => {
  // Execute all 5 database queries concurrently
  const [enrollment, announcements, sessions, assignments, quizzes] = await Promise.all([
    // 1. Verify enrollment and fetch course details
    prisma.courseenrollment.findFirst({
      where: {
        student: { userid: userId },
        courseofferingid: courseOfferingId,
        isactive: true,
      },
      include: {
        courseoffering: {
          include: {
            course: true,
            semester: true,
            faculty: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    }),

    // 2. Fetch announcements
    prisma.courseannouncement.findMany({
      where: {
        courseofferingid: courseOfferingId,
        isactive: true,
      },
      orderBy: {
        createdat: 'desc',
      },
    }),

    // 3. Fetch class sessions (lectures) & attendance
    prisma.classsession.findMany({
      where: {
        courseofferingid: courseOfferingId,
        isactive: true,
      },
      include: {
        attendance: {
          where: {
            student: { userid: userId },
            isactive: true,
          },
        },
      },
      orderBy: {
        sessiondate: 'asc',
      },
    }),

    // 4. Fetch assignments & submissions
    prisma.assignment.findMany({
      where: {
        courseofferingid: courseOfferingId,
        isactive: true,
      },
      include: {
        assignmentsubmission: {
          where: {
            student: { userid: userId },
            isactive: true,
          },
          include: {
            peerreview: {
              where: {
                isactive: true,
              },
            },
          },
        },
      },
      orderBy: {
        duedate: 'asc',
      },
    }),

    // 5. Fetch quizzes & attempts
    prisma.quiz.findMany({
      where: {
        courseofferingid: courseOfferingId,
        isactive: true,
      },
      include: {
        quizattempt: {
          where: {
            student: { userid: userId },
            isactive: true,
          },
        },
      },
      orderBy: {
        createdat: 'asc',
      },
    }),
  ]);

  if (!enrollment) {
    throw new AppError(403, 'You are not enrolled in this course.');
  }

  const offering = enrollment.courseoffering;
  const instructorName = offering.faculty
    ? (offering.faculty.fullname || offering.faculty.user.username)
    : 'TBD';

  // 6. Map weekly items dynamically using the semester startdate
  const semesterStartDate = offering.semester.startdate 
    ? new Date(offering.semester.startdate) 
    : new Date(); // fallback to current date

  // We can group all items (sessions, assignments, quizzes) by week number
  // A semester typically has 16 weeks
  const totalWeeks = 16;
  const weeks = Array.from({ length: totalWeeks }, (_, idx) => {
    const weekNumber = idx + 1;
    const weekStart = new Date(semesterStartDate.getTime() + idx * 7 * 24 * 3600 * 1000);
    const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 3600 * 1000);

    const dateRangeStr = `${weekStart.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`;

    const items: any[] = [];

    // Add sessions belonging to this week
    sessions.forEach((s) => {
      const sDate = new Date(s.sessiondate);
      if (sDate >= weekStart && sDate <= weekEnd) {
        const attRecord = s.attendance[0];
        items.push({
          type: 'lecture',
          title: s.topic || 'Class Session',
          date: sDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
          status: (attRecord && attRecord.status) ? attRecord.status.toLowerCase() : 'scheduled',
          sessionDate: s.sessiondate,
          startTime: s.starttime,
          endTime: s.endtime,
        });
      }
    });

    // Add assignments belonging to this week based on due date
    assignments.forEach((a) => {
      const aDate = new Date(a.duedate);
      if (aDate >= weekStart && aDate <= weekEnd) {
        const sub = a.assignmentsubmission[0];
        items.push({
          type: 'assignment',
          id: a.assignmentid,
          title: a.title,
          dueDate: aDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
          status: sub ? 'submitted' : 'pending',
          maxmarks: a.maxmarks,
          marksawarded: sub?.peerreview?.[0]?.score ?? null,
        });
      }
    });

    // Add quizzes belonging to this week based on creation/availability date
    quizzes.forEach((q) => {
      // Typically quizzes are available within the week they are created/started
      const qDate = q.createdat ? new Date(q.createdat) : new Date();
      if (qDate >= weekStart && qDate <= weekEnd) {
        const attempt = q.quizattempt[0];
        items.push({
          type: 'quiz',
          id: q.quizid,
          title: q.title,
          dueDate: new Date(q.createdat).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
          status: attempt ? 'completed' : 'pending',
          score: attempt ? attempt.score : null,
          totalmarks: q.totalmarks,
        });
      }
    });

    return {
      weekNumber,
      dateRange: dateRangeStr,
      items,
    };
  }).filter((w) => w.items.length > 0 || w.weekNumber <= 6); // Keep first 6 weeks or any week with content

  // 7. Calculate detailed grades contribution
  const grades = {
    assignments: assignments.map((a) => {
      const sub = a.assignmentsubmission[0];
      const peerReview = sub?.peerreview?.[0];
      return {
        id: a.assignmentid,
        name: a.title,
        grade: peerReview && peerReview.score !== null ? peerReview.score.toString() : '-',
        range: `0-${a.maxmarks}`,
        feedback: peerReview && peerReview.feedback ? peerReview.feedback : '-',
      };
    }),
    quizzes: quizzes.map((q) => {
      const attempt = q.quizattempt[0];
      return {
        id: q.quizid,
        name: q.title,
        grade: attempt && attempt.score !== null ? attempt.score.toString() : '-',
        range: `0-${q.totalmarks}`,
        feedback: '-',
      };
    }),
    courseTotal: {
      grade: enrollment.grade || 'N/A',
      percentage: enrollment.percentage !== null ? `${enrollment.percentage}%` : '—',
    },
  };

  return {
    course: {
      courseOfferingId: offering.courseofferingid,
      code: offering.course.code,
      name: offering.course.name,
      credits: offering.course.credits,
      semester: offering.semester.name,
      instructor: instructorName,
      mode: offering.capacity > 25 ? 'Face-to-Face' : 'Hybrid',
    },
    announcements: announcements.map((a) => ({
      id: a.courseannouncementid,
      title: a.title,
      content: a.content,
      type: a.type || 'info',
      date: a.createdat,
    })),
    attendance: sessions.map((s) => {
      const att = s.attendance[0];
      return {
        id: s.classsessionid,
        date: new Date(s.sessiondate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
        topic: s.topic || 'Class Lecture',
        status: att ? att.status : 'N/A',
      };
    }),
    weeks,
    grades,
  };
};
