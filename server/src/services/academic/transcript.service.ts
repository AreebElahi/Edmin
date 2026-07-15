import prisma from '../../config/prisma.js';
import { processRepeats } from './repeatPolicy.service.js';
import { checkFinancialClearance } from '../finance/financialClearance.service.js';

export const generateSemesterTranscript = async (studentId: number, semesterId: number) => {
  const record = await prisma.semesterrecord.findUnique({
    where: { studentid_semesterid: { studentid: studentId, semesterid: semesterId } },
    include: { semester: true, student: { include: { user: true } } }
  });

  if (!record) throw new Error('No record found for this semester');

  const enrollments = await prisma.courseenrollment.findMany({
    where: { studentid: studentId, status: 'COMPLETED', courseoffering: { semesterid: semesterId } },
    include: { courseoffering: { include: { course: true } } }
  });

  const { allRecords } = processRepeats(enrollments);

  return {
    semester: record.semester.name,
    student: record.student.user.username,
    courses: allRecords.map((r: any) => ({
      courseCode: r.courseoffering.course.code,
      courseName: r.courseoffering.course.name,
      credits: r.courseoffering.course.credits,
      grade: r.grade,
      gradePoints: r.gradepoints,
      isRepeated: r.isRepeatedIn || r.isRepeatedOut,
      countsTowardsGPA: !r.isRepeatedOut
    })),
    semesterGPA: record.semestergpa,
    cgpa: record.cgpa,
    standing: record.standing
  };
};

export const generateFullTranscript = async (studentId: number) => {
  const records = await prisma.semesterrecord.findMany({
    where: { studentid: studentId },
    include: { semester: true, student: { include: { user: true } } },
    orderBy: { semester: { year: 'asc' } } // simplified sort
  });

  const enrollments = await prisma.courseenrollment.findMany({
    where: { studentid: studentId, status: 'COMPLETED' },
    include: { courseoffering: { include: { course: true, semester: true } } }
  });

  const { allRecords } = processRepeats(enrollments);

  const semesters = records.map(record => {
    const semEnrollments = allRecords.filter((r: any) => r.courseoffering.semesterid === record.semesterid);
    return {
      semester: record.semester.name,
      courses: semEnrollments.map((r: any) => ({
        courseCode: r.courseoffering.course.code,
        courseName: r.courseoffering.course.name,
        credits: r.courseoffering.course.credits,
        grade: r.grade,
        gradePoints: r.gradepoints,
        isRepeated: r.isRepeatedIn || r.isRepeatedOut,
        countsTowardsGPA: !r.isRepeatedOut
      })),
      semesterGPA: record.semestergpa,
      cgpa: record.cgpa,
      standing: record.standing
    };
  });

  const latestRecord = records[records.length - 1];

  return {
    studentId,
    studentName: records[0]?.student.user.username,
    totalEarnedCredits: latestRecord?.earnedcredits || 0,
    finalCGPA: latestRecord?.cgpa || 0,
    semesters
  };
};

export const generateUnofficialTranscript = async (studentId: number) => {
  const transcript = await generateFullTranscript(studentId);
  return {
    ...transcript,
    isOfficial: false,
    generatedAt: new Date()
  };
};

export const generateOfficialTranscript = async (studentId: number) => {
  const isCleared = await checkFinancialClearance(studentId);
  if (!isCleared) {
    throw new Error('Transcript HOLD: Financial clearance required for official transcripts.');
  }

  const transcript = await generateFullTranscript(studentId);
  return {
    ...transcript,
    isOfficial: true,
    registrarSignature: 'PENDING',
    generatedAt: new Date()
  };
};
