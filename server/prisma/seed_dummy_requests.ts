import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET_NAME = 'Edmin bucket';

async function main() {
  console.log('Seeding testing data for assignment submissions...');

  // 1. Initialize Supabase and upload mock files
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Warning: Missing Supabase credentials. Skipping file uploads.');
  } else {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      console.log('Uploading mock zip file to Supabase storage...');
      const dummyZip = Buffer.from('PK\x03\x04Mock ZIP file content for testing downloads.');
      const { error: zipErr } = await supabase.storage
        .from(BUCKET_NAME)
        .upload('assignments/lab1_alice_smith_scopes.zip', dummyZip, {
          contentType: 'application/zip',
          upsert: true
        });
      if (zipErr) console.error('Supabase ZIP upload error:', zipErr.message);

      console.log('Uploading mock pdf file to Supabase storage...');
      const dummyPdf = Buffer.from('%PDF-1.4 Mock PDF content for testing downloads.');
      const { error: pdfErr } = await supabase.storage
        .from(BUCKET_NAME)
        .upload('assignments/lab1_bob_jones_types.pdf', dummyPdf, {
          contentType: 'application/pdf',
          upsert: true
        });
      if (pdfErr) console.error('Supabase PDF upload error:', pdfErr.message);
      
      console.log('Mock files uploaded successfully.');
    } catch (e: any) {
      console.error('Failed to upload mock files to Supabase:', e.message);
    }
  }

  // 2. Find or create users
  const passwordHash = await bcrypt.hash('password123', 10);

  const facultyUser = await prisma.user.upsert({
    where: { username: 'faculty_user1' },
    update: { institutionalEmail: 'user1@edmin.com', password: passwordHash, role: 'FACULTY', accountStatus: 'ACTIVE' },
    create: { username: 'faculty_user1', institutionalEmail: 'user1@edmin.com', email: 'user1@edmin.com', password: passwordHash, role: 'FACULTY', accountStatus: 'ACTIVE' }
  });

  const studentUser1 = await prisma.user.upsert({
    where: { username: 'student_user1' },
    update: { institutionalEmail: 'student@edmin.com', password: passwordHash, role: 'STUDENT', accountStatus: 'ACTIVE' },
    create: { username: 'student_user1', institutionalEmail: 'student@edmin.com', email: 'student@edmin.com', password: passwordHash, role: 'STUDENT', accountStatus: 'ACTIVE' }
  });

  const studentUser2 = await prisma.user.upsert({
    where: { username: 'student_user2' },
    update: { institutionalEmail: 'student2@edmin.com', password: passwordHash, role: 'STUDENT', accountStatus: 'ACTIVE' },
    create: { username: 'student_user2', institutionalEmail: 'student2@edmin.com', email: 'student2@edmin.com', password: passwordHash, role: 'STUDENT', accountStatus: 'ACTIVE' }
  });

  const studentUser3 = await prisma.user.upsert({
    where: { username: 'student_user3' },
    update: { institutionalEmail: 'student3@edmin.com', password: passwordHash, role: 'STUDENT', accountStatus: 'ACTIVE' },
    create: { username: 'student_user3', institutionalEmail: 'student3@edmin.com', email: 'student3@edmin.com', password: passwordHash, role: 'STUDENT', accountStatus: 'ACTIVE' }
  });

  // Assign user roles
  const studentRole = await prisma.role.findFirst({ where: { name: 'STUDENT' } });
  const facultyRole = await prisma.role.findFirst({ where: { name: 'FACULTY' } });

  if (facultyRole) {
    await prisma.userRole.upsert({
      where: { user_id_role_id: { user_id: facultyUser.userid, role_id: facultyRole.id } },
      update: {},
      create: { user_id: facultyUser.userid, role_id: facultyRole.id }
    });
  }

  if (studentRole) {
    for (const u of [studentUser1, studentUser2, studentUser3]) {
      await prisma.userRole.upsert({
        where: { user_id_role_id: { user_id: u.userid, role_id: studentRole.id } },
        update: {},
        create: { user_id: u.userid, role_id: studentRole.id }
      });
    }
  }

  // 3. Department
  const department = await prisma.department.upsert({
    where: { departmentid: 1 },
    update: { code: 'CS', name: 'Computer Science', isactive: true },
    create: { departmentid: 1, code: 'CS', name: 'Computer Science', isactive: true }
  });

  // 4. Faculty Profile
  const facultyProfile = await prisma.faculty.upsert({
    where: { userid: facultyUser.userid },
    update: { fullname: 'Dr. John Doe', departmentid: department.departmentid, isactive: true },
    create: { userid: facultyUser.userid, fullname: 'Dr. John Doe', departmentid: department.departmentid, isactive: true }
  });

  // 5. Student Profiles
  const studentProfile1 = await prisma.student.upsert({
    where: { userid: studentUser1.userid },
    update: { fullname: 'Alice Smith', rollnumber: 'CS-2026-001', departmentid: department.departmentid, isactive: true, status: 'ACTIVE' },
    create: { userid: studentUser1.userid, fullname: 'Alice Smith', rollnumber: 'CS-2026-001', departmentid: department.departmentid, isactive: true, status: 'ACTIVE' }
  });

  const studentProfile2 = await prisma.student.upsert({
    where: { userid: studentUser2.userid },
    update: { fullname: 'Bob Jones', rollnumber: 'CS-2026-002', departmentid: department.departmentid, isactive: true, status: 'ACTIVE' },
    create: { userid: studentUser2.userid, fullname: 'Bob Jones', rollnumber: 'CS-2026-002', departmentid: department.departmentid, isactive: true, status: 'ACTIVE' }
  });

  const studentProfile3 = await prisma.student.upsert({
    where: { userid: studentUser3.userid },
    update: { fullname: 'Charlie Brown', rollnumber: 'CS-2026-003', departmentid: department.departmentid, isactive: true, status: 'ACTIVE' },
    create: { userid: studentUser3.userid, fullname: 'Charlie Brown', rollnumber: 'CS-2026-003', departmentid: department.departmentid, isactive: true, status: 'ACTIVE' }
  });

  // 6. Semester
  const semester = await prisma.semester.upsert({
    where: { semesterid: 1 },
    update: { name: 'Fall 2026', year: 2026, status: 'ONGOING', isactive: true },
    create: { semesterid: 1, name: 'Fall 2026', year: 2026, status: 'ONGOING', isactive: true }
  });

  // 7. Course
  const course = await prisma.course.upsert({
    where: { departmentid_code: { departmentid: department.departmentid, code: 'CSE-101' } },
    update: { name: 'Introduction to Programming', credits: 3, isactive: true },
    create: { departmentid: department.departmentid, code: 'CSE-101', name: 'Introduction to Programming', credits: 3, isactive: true }
  });

  // DepartmentCourse junction
  const depCourse = await prisma.departmentcourse.findFirst({
    where: { departmentid: department.departmentid, courseid: course.courseid }
  });
  if (!depCourse) {
    await prisma.departmentcourse.create({
      data: { departmentid: department.departmentid, courseid: course.courseid }
    });
  }

  // 8. Course Offering
  const courseOffering = await prisma.courseoffering.upsert({
    where: { courseofferingid: 1 },
    update: {
      courseid: course.courseid,
      semesterid: semester.semesterid,
      departmentid: department.departmentid,
      instructorid: facultyProfile.facultyid,
      facultyid: facultyProfile.facultyid,
      isactive: true,
      status: 'ACTIVE'
    },
    create: {
      courseofferingid: 1,
      courseid: course.courseid,
      semesterid: semester.semesterid,
      departmentid: department.departmentid,
      instructorid: facultyProfile.facultyid,
      facultyid: facultyProfile.facultyid,
      isactive: true,
      status: 'ACTIVE'
    }
  });

  // Enroll students
  for (const s of [studentProfile1, studentProfile2, studentProfile3]) {
    const enrollment = await prisma.courseenrollment.findFirst({
      where: { courseofferingid: courseOffering.courseofferingid, studentid: s.studentid }
    });
    if (!enrollment) {
      await prisma.courseenrollment.create({
        data: { courseofferingid: courseOffering.courseofferingid, studentid: s.studentid, status: 'ENROLLED', isactive: true }
      });
    }
  }

  // 9. Assignment
  const assignment = await prisma.assignment.upsert({
    where: { assignmentid: 1 },
    update: {
      courseofferingid: courseOffering.courseofferingid,
      title: 'Lab 1: Variable Scopes and Types',
      maxmarks: 100,
      duedate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // due in 7 days
      isactive: true
    },
    create: {
      assignmentid: 1,
      courseofferingid: courseOffering.courseofferingid,
      title: 'Lab 1: Variable Scopes and Types',
      maxmarks: 100,
      duedate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isactive: true
    }
  });

  // 10. Assignment Submissions
  // Student 1: Submitted but not graded (pointing to uploaded file starting with uploads/)
  const submission1 = await prisma.assignmentsubmission.upsert({
    where: { assignmentsubmissionid: 1 },
    update: {
      assignmentid: assignment.assignmentid,
      studentid: studentProfile1.studentid,
      status: 'SUBMITTED',
      fileUrl: 'uploads/assignments/lab1_alice_smith_scopes.zip',
      isactive: true
    },
    create: {
      assignmentsubmissionid: 1,
      assignmentid: assignment.assignmentid,
      studentid: studentProfile1.studentid,
      status: 'SUBMITTED',
      fileUrl: 'uploads/assignments/lab1_alice_smith_scopes.zip',
      isactive: true
    }
  });

  // Student 2: Submitted and Graded (pointing to uploaded file starting with uploads/)
  const submission2 = await prisma.assignmentsubmission.upsert({
    where: { assignmentsubmissionid: 2 },
    update: {
      assignmentid: assignment.assignmentid,
      studentid: studentProfile2.studentid,
      status: 'GRADED',
      fileUrl: 'uploads/assignments/lab1_bob_jones_types.pdf',
      isactive: true
    },
    create: {
      assignmentsubmissionid: 2,
      assignmentid: assignment.assignmentid,
      studentid: studentProfile2.studentid,
      status: 'GRADED',
      fileUrl: 'uploads/assignments/lab1_bob_jones_types.pdf',
      isactive: true
    }
  });

  // Upsert PeerReview for Student 2
  const peerReview2 = await prisma.peerreview.findFirst({
    where: { submissionid: submission2.assignmentsubmissionid, reviewerid: facultyUser.userid }
  });
  if (peerReview2) {
    await prisma.peerreview.update({
      where: { peerreviewid: peerReview2.peerreviewid },
      data: { score: 85, feedback: 'Great work! Code is clean and variables are well named.', isactive: true }
    });
  } else {
    await prisma.peerreview.create({
      data: {
        submissionid: submission2.assignmentsubmissionid,
        assignmentsubmissionid: submission2.assignmentsubmissionid,
        reviewerid: facultyUser.userid,
        score: 85,
        feedback: 'Great work! Code is clean and variables are well named.',
        userid: studentUser2.userid,
        isactive: true
      }
    });
  }

  // Student 3: Pending (No submission)
  const existingSub3 = await prisma.assignmentsubmission.findFirst({
    where: { assignmentid: assignment.assignmentid, studentid: studentProfile3.studentid }
  });
  if (existingSub3) {
    await prisma.assignmentsubmission.delete({
      where: { assignmentsubmissionid: existingSub3.assignmentsubmissionid }
    });
  }

  console.log('Test data and Supabase files seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
