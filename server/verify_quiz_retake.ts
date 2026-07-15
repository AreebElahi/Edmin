import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function main() {
  const user: any = (await prisma.$queryRaw`SELECT userid, role FROM "user" WHERE email = 'student@edmin.com'`)[0];
  if (!user) throw new Error('Student user not found');
  
  let student: any = (await prisma.$queryRaw`SELECT studentid FROM student WHERE userid = ${user.userid}`)[0];
  if (!student) {
    await prisma.$executeRawUnsafe(`INSERT INTO student (userid) VALUES (${user.userid})`);
    student = (await prisma.$queryRaw`SELECT studentid FROM student WHERE userid = ${user.userid}`)[0];
  }

  let dept: any = (await prisma.$queryRaw`SELECT departmentid FROM department LIMIT 1`)[0];
  if (!dept) {
    await prisma.$executeRawUnsafe(`INSERT INTO department (name, code, description) VALUES ('Test Dept', 'TD', 'Test')`);
    dept = (await prisma.$queryRaw`SELECT departmentid FROM department LIMIT 1`)[0];
  }

  let course: any = (await prisma.$queryRaw`SELECT courseid FROM course LIMIT 1`)[0];
  if (!course) {
    await prisma.$executeRawUnsafe(`INSERT INTO course (code, name, credits, departmentid) VALUES ('CS101', 'Test', 3, ${dept.departmentid})`);
    course = (await prisma.$queryRaw`SELECT courseid FROM course LIMIT 1`)[0];
  }

  let sem: any = (await prisma.$queryRaw`SELECT semesterid FROM semester LIMIT 1`)[0];
  if (!sem) {
    await prisma.$executeRawUnsafe(`INSERT INTO semester (name, startdate, enddate, year) VALUES ('Test Sem', NOW(), NOW(), 2026)`);
    sem = (await prisma.$queryRaw`SELECT semesterid FROM semester LIMIT 1`)[0];
  }

  let offering: any = (await prisma.$queryRaw`SELECT courseofferingid FROM courseoffering LIMIT 1`)[0];
  if (!offering) {
    await prisma.$executeRawUnsafe(`INSERT INTO courseoffering (courseid, semesterid, departmentid, status) VALUES (${course.courseid}, ${sem.semesterid}, ${dept.departmentid}, 'ACTIVE')`);
    offering = (await prisma.$queryRaw`SELECT courseofferingid FROM courseoffering LIMIT 1`)[0];
  }

  let faculty: any = (await prisma.$queryRaw`SELECT facultyid FROM faculty LIMIT 1`)[0];
  if (!faculty) {
    await prisma.$executeRawUnsafe(`INSERT INTO faculty (userid, departmentid) VALUES (${user.userid}, ${dept.departmentid})`);
    faculty = (await prisma.$queryRaw`SELECT facultyid FROM faculty LIMIT 1`)[0];
  }

  let aiQuiz: any = (await prisma.$queryRaw`SELECT aiquizid FROM aiquiz LIMIT 1`)[0];
  if (!aiQuiz) {
    await prisma.$executeRawUnsafe(`INSERT INTO aiquiz (title, courseofferingid, facultyid, status, questioncount, timelimitminutes, isactive) VALUES ('Test AI Quiz', ${offering.courseofferingid}, ${faculty.facultyid}, 'PUBLISHED', 1, 10, true)`);
    aiQuiz = (await prisma.$queryRaw`SELECT aiquizid FROM aiquiz LIMIT 1`)[0];
    
    await prisma.$executeRawUnsafe(`INSERT INTO aiquizquestion (aiquizid, questiontext, type, options, correctanswer, points, questionorder) VALUES (${aiQuiz.aiquizid}, 'Is this a test?', 'TRUE_FALSE', '["True", "False"]'::jsonb, 'True', 10, 1)`);
  }

  let enroll: any = (await prisma.$queryRaw`SELECT courseenrollmentid FROM courseenrollment WHERE studentid = ${student.studentid} AND courseofferingid = ${offering.courseofferingid}`)[0];
  if (!enroll) {
    await prisma.$executeRawUnsafe(`INSERT INTO courseenrollment (studentid, courseofferingid, status) VALUES (${student.studentid}, ${offering.courseofferingid}, 'ENROLLED')`);
  }

  await prisma.$executeRawUnsafe(`DELETE FROM aiquizattempt WHERE aiquizid = ${aiQuiz.aiquizid} AND studentid = ${student.studentid}`);
  console.log(`Cleared previous attempts for aiquizid=${aiQuiz.aiquizid}, studentid=${student.studentid}`);

  const synthQuizId = aiQuiz.aiquizid + 1000000000;
  
  const token = jwt.sign(
    { userId: user.userid, role: user.role },
    process.env.JWT_ACCESS_SECRET || '4a99d31be959093a49ec32b5a12ea90d2a5d8f09020a60be4254ad44735ce90d',
    { expiresIn: '15m' }
  );

  const q: any = (await prisma.$queryRaw`SELECT aiquizquestionid FROM aiquizquestion WHERE aiquizid = ${aiQuiz.aiquizid}`)[0];

  const payload = {
    answers: [{
      questionId: q.aiquizquestionid + 1000000000,
      selectedOptionId: 1
    }]
  };

  const attemptQuiz = async () => fetch(`http://localhost:5000/api/v1/student/quizzes/${synthQuizId}/attempt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(payload)
  });

  const dbCheck = async () => {
    const attempts: any = await prisma.$queryRaw`SELECT score FROM aiquizattempt WHERE aiquizid = ${aiQuiz.aiquizid} AND studentid = ${student.studentid}`;
    console.log(`DB Check: SELECT * FROM aiquizattempt WHERE studentid = ${student.studentid} AND aiquizid = ${aiQuiz.aiquizid};`);
    console.log(`Row count: ${attempts.length}, Score: ${attempts.length > 0 ? attempts[0].score : 'N/A'}`);
  };

  await dbCheck();

  console.log('\n--- FIRST ATTEMPT ---');
  const res1 = await attemptQuiz();
  console.log(`HTTP Response: ${res1.status}`);
  console.log(JSON.stringify(await res1.json(), null, 2));
  await dbCheck();

  console.log('\n--- SECOND ATTEMPT ---');
  const res2 = await attemptQuiz();
  console.log(`HTTP Response: ${res2.status}`);
  console.log(JSON.stringify(await res2.json(), null, 2));
  await dbCheck();

  await prisma.$disconnect();
}

main().catch(console.error);
