import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding student portal data...');

  // 1. Create Department
  let dept = await prisma.department.findFirst({
    where: { code: 'CS' },
  });
  if (!dept) {
    dept = await prisma.department.create({
      data: {
        name: 'Computer Science',
        code: 'CS',
        type: 'ACADEMIC',
      },
    });
  }

  // 2. Create Program
  let prog = await prisma.program.findFirst({
    where: { code: 'BSCS' },
  });
  if (!prog) {
    prog = await prisma.program.create({
      data: {
        name: 'Bachelor of Science in Computer Science',
        code: 'BSCS',
        departmentid: dept.departmentid,
      },
    });
  }

  // 3. Create Semester
  let sem = await prisma.semester.findFirst({
    where: { name: 'Fall 2026', year: 2026 },
  });
  if (!sem) {
    sem = await prisma.semester.create({
      data: {
        name: 'Fall 2026',
        year: 2026,
        status: 'ONGOING',
      },
    });
  }

  // 4. Create User for Student
  const passwordHash = await bcrypt.hash('password123', 10);
  let user = await prisma.user.findUnique({
    where: { username: 'teststudent' },
  });
  if (!user) {
    user = await prisma.user.create({
      data: {
        username: 'teststudent',
        email: 'student@edmin.com',
        password: passwordHash,
        role: 'STUDENT',
        identifier: 'STU-12345',
        institutionalEmail: 'teststudent@edmin.edu',
        accountStatus: 'ACTIVE',
        mustChangePassword: false,
      },
    });
  } else {
    user = await prisma.user.update({
      where: { userid: user.userid },
      data: {
        password: passwordHash,
        accountStatus: 'ACTIVE',
      },
    });
  }

  // 5. Create Student record
  let student = await prisma.student.findFirst({
    where: { userid: user.userid },
  });
  if (!student) {
    student = await prisma.student.create({
      data: {
        userid: user.userid,
        departmentid: dept.departmentid,
        programid: prog.programid,
        semesterid: sem.semesterid,
        status: 'ACTIVE',
        fullname: 'Test Student',
        rollnumber: '2026-CS-01',
      },
    });
  }

  // 6. Create Student Personal Record
  let personalRecord = await prisma.studentpersonalrecord.findFirst({
    where: { studentid_ref: student.studentid },
  });
  if (!personalRecord) {
    personalRecord = await prisma.studentpersonalrecord.create({
      data: {
        studentid_ref: student.studentid,
        firstname: 'Test',
        lastname: 'Student',
        dateofbirth: new Date('2005-09-15'),
        gender: 'MALE',
        nationality: 'Global',
        contactnumber: '1234567890',
        emailaddress: 'student@edmin.com',
      },
    });
  }

  // 7. Create Course
  let course = await prisma.course.findFirst({
    where: { code: 'CS101' },
  });
  if (!course) {
    course = await prisma.course.create({
      data: {
        name: 'Introduction to Programming',
        code: 'CS101',
        credits: 3,
        departmentid: dept.departmentid,
      },
    });
  }

  // 8. Create Course Offering
  let offering = await prisma.courseoffering.findFirst({
    where: { courseid: course.courseid, semesterid: sem.semesterid },
  });
  if (!offering) {
    offering = await prisma.courseoffering.create({
      data: {
        courseid: course.courseid,
        semesterid: sem.semesterid,
        departmentid: dept.departmentid,
        capacity: 50,
        status: 'ACTIVE',
      },
    });
  }

  // 9. Create Course Enrollment
  let enrollment = await prisma.courseenrollment.findFirst({
    where: { studentid: student.studentid, courseofferingid: offering.courseofferingid },
  });
  if (!enrollment) {
    enrollment = await prisma.courseenrollment.create({
      data: {
        studentid: student.studentid,
        courseofferingid: offering.courseofferingid,
        status: 'ENROLLED',
        grade: 'A',
        gradepoints: 4.0,
        percentage: 95,
      },
    });
  }

  // 10. Create Attendance Summary
  let attSummary = await prisma.attendancesummary.findFirst({
    where: { studentid: student.studentid, courseofferingid: offering.courseofferingid },
  });
  if (!attSummary) {
    attSummary = await prisma.attendancesummary.create({
      data: {
        studentid: student.studentid,
        courseofferingid: offering.courseofferingid,
        totalpresent: 18,
        totalabsent: 2,
        totalclasses: 20,
      },
    });
  }

  // 11. Create Class Session for Attendance Detailed View
  let session = await prisma.classsession.findFirst({
    where: { courseofferingid: offering.courseofferingid, sessiondate: new Date('2026-09-07') },
  });
  if (!session) {
    session = await prisma.classsession.create({
      data: {
        courseofferingid: offering.courseofferingid,
        sessiondate: new Date('2026-09-07'),
        starttime: new Date('2026-09-07T09:00:00Z'),
        endtime: new Date('2026-09-07T10:30:00Z'),
        status: 'COMPLETED',
        topic: 'Introduction to Programming basics',
      },
    });
  }

  // Student Attendance detailed log
  let attendance = await prisma.attendance.findUnique({
    where: { studentid_sessionid: { studentid: student.studentid, sessionid: session.classsessionid } },
  });
  if (!attendance) {
    attendance = await prisma.attendance.create({
      data: {
        studentid: student.studentid,
        sessionid: session.classsessionid,
        status: 'PRESENT',
      },
    });
  }

  // 12. Create Timetable entry
  let tt = await prisma.timetable.findFirst({
    where: { courseofferingid: offering.courseofferingid, dayofweek: 'MON' },
  });
  if (!tt) {
    tt = await prisma.timetable.create({
      data: {
        courseofferingid: offering.courseofferingid,
        dayofweek: 'MON',
        starttime: new Date('2026-09-01T09:00:00Z'),
        endtime: new Date('2026-09-01T10:30:00Z'),
        room: 'Room 101',
      },
    });
  }

  // 13. Create Assignment
  let assignment = await prisma.assignment.findFirst({
    where: { courseofferingid: offering.courseofferingid, title: 'First Programming Assignment' },
  });
  if (!assignment) {
    assignment = await prisma.assignment.create({
      data: {
        courseofferingid: offering.courseofferingid,
        title: 'First Programming Assignment',
        duedate: new Date(Date.now() + 86400000 * 7), // 7 days from now
        maxmarks: 100,
      },
    });
  }

  // 14. Create Assignment Submission
  let submission = await prisma.assignmentsubmission.findFirst({
    where: { assignmentid: assignment.assignmentid, studentid: student.studentid },
  });
  if (!submission) {
    submission = await prisma.assignmentsubmission.create({
      data: {
        assignmentid: assignment.assignmentid,
        studentid: student.studentid,
        status: 'SUBMITTED',
        createdat: new Date(),
      },
    });
  }

  // 15. Create Question Category and Questions in Question Bank
  let qCategory = await prisma.questioncategory.findFirst({
    where: { name: 'Programming Basics' },
  });
  if (!qCategory) {
    qCategory = await prisma.questioncategory.create({
      data: {
        name: 'Programming Basics',
        departmentid: dept.departmentid,
      },
    });
  }

  let qBank1 = await prisma.questionbank.findFirst({
    where: { questiontext: 'What is the time complexity of binary search?' },
  });
  if (!qBank1) {
    qBank1 = await prisma.questionbank.create({
      data: {
        categoryid: qCategory.questioncategoryid,
        questiontext: 'What is the time complexity of binary search?',
        difficulty: 'EASY',
        type: 'MCQ',
      },
    });
  }

  // Options for Question 1
  let opt1 = await prisma.quizoption.findFirst({
    where: { questionbankid: qBank1.questionbankid, optiontext: 'O(log n)' },
  });
  if (!opt1) {
    opt1 = await prisma.quizoption.create({
      data: {
        questionbankid: qBank1.questionbankid,
        optiontext: 'O(log n)',
        iscorrect: true,
      },
    });
  }

  let opt2 = await prisma.quizoption.findFirst({
    where: { questionbankid: qBank1.questionbankid, optiontext: 'O(n)' },
  });
  if (!opt2) {
    opt2 = await prisma.quizoption.create({
      data: {
        questionbankid: qBank1.questionbankid,
        optiontext: 'O(n)',
        iscorrect: false,
      },
    });
  }

  // 16. Create Quiz
  let quiz = await prisma.quiz.findFirst({
    where: { courseofferingid: offering.courseofferingid, title: 'Midterm Quiz' },
  });
  if (!quiz) {
    quiz = await prisma.quiz.create({
      data: {
        courseofferingid: offering.courseofferingid,
        title: 'Midterm Quiz',
        totalmarks: 50,
        duration: 30,
      },
    });
  }

  // Link question to Quiz
  let quizQuestion = await prisma.quizquestion.findFirst({
    where: { quizid: quiz.quizid, questionbankid: qBank1.questionbankid },
  });
  if (!quizQuestion) {
    await prisma.quizquestion.create({
      data: {
        quizid: quiz.quizid,
        questionbankid: qBank1.questionbankid,
        points: 50,
      },
    });
  }

  // 17. Create Quiz Attempt
  let attempt = await prisma.quizattempt.findFirst({
    where: { quizid: quiz.quizid, studentid: student.studentid },
  });
  if (!attempt) {
    attempt = await prisma.quizattempt.create({
      data: {
        quizid: quiz.quizid,
        studentid: student.studentid,
        score: 50,
        startedat: new Date(),
        submittedat: new Date(),
      },
    });
  }

  // Answers inside attempt
  let answer = await prisma.quizanswer.findFirst({
    where: { attemptid: attempt.quizattemptid, questionbankid: qBank1.questionbankid },
  });
  if (!answer) {
    await prisma.quizanswer.create({
      data: {
        attemptid: attempt.quizattemptid,
        questionbankid: qBank1.questionbankid,
        selectedoptionid: opt1.quizoptionid,
        marksawarded: 50,
      },
    });
  }

  // 18. Create Notification
  let notif = await prisma.notification.findFirst({
    where: { userid: user.userid, title: 'Welcome to Edmin LMS' },
  });
  if (!notif) {
    await prisma.notification.create({
      data: {
        userid: user.userid,
        title: 'Welcome to Edmin LMS',
        message: 'Welcome to your student dashboard!',
        isread: false,
        type: 'SYSTEM',
      },
    });
  }

  // 19. Create an unattempted quiz for testing details & attempt
  let quiz2 = await prisma.quiz.findFirst({
    where: { courseofferingid: offering.courseofferingid, title: 'Weekly Quiz 1' },
  });
  if (!quiz2) {
    quiz2 = await prisma.quiz.create({
      data: {
        courseofferingid: offering.courseofferingid,
        title: 'Weekly Quiz 1',
        totalmarks: 20,
        duration: 15,
      },
    });
  }

  // Link question to Quiz 2
  let quizQuestion2 = await prisma.quizquestion.findFirst({
    where: { quizid: quiz2.quizid, questionbankid: qBank1.questionbankid },
  });
  if (!quizQuestion2) {
    await prisma.quizquestion.create({
      data: {
        quizid: quiz2.quizid,
        questionbankid: qBank1.questionbankid,
        points: 20,
      },
    });
  }

  console.log('Student data seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
