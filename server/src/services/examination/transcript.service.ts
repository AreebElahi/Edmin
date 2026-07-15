import prisma from '../../config/prisma.js';

export const getStudentTranscriptData = async (studentId: number) => {
    // 1. Fetch student info
    const student = await prisma.student.findUnique({
        where: { studentid: studentId },
        include: {
            user: true,
            department: true,
            semester: true
        }
    });

    if (!student) throw new Error('Student not found');

    // 2. Fetch all completed enrollments
    const enrollments = await prisma.courseenrollment.findMany({
        where: {
            studentid: studentId,
            status: 'COMPLETED'
        },
        include: {
            courseoffering: {
                include: {
                    course: true,
                    semester: true
                }
            }
        },
        orderBy: {
            courseoffering: {
                semester: {
                    startdate: 'asc'
                }
            }
        }
    });

    // 3. Fetch all semester records
    const semesterRecords = await prisma.semesterrecord.findMany({
        where: { studentid: studentId },
        include: {
            semester: true
        },
        orderBy: {
            semester: {
                startdate: 'asc'
            }
        }
    });

    // 4. Group enrollments by semester
    const semestersMap: Record<number, {
        semesterId: number;
        semesterName: string;
        gpa: number;
        cgpa: number;
        earnedCredits: number;
        courses: any[];
    }> = {};

    // Initialize with semester records to ensure semesters with no courses still show (if any) or to map them
    semesterRecords.forEach(rec => {
        semestersMap[rec.semesterid] = {
            semesterId: rec.semesterid,
            semesterName: rec.semester?.name || `Semester #${rec.semesterid}`,
            gpa: rec.semestergpa,
            cgpa: rec.cgpa,
            earnedCredits: rec.earnedcredits,
            courses: []
        };
    });

    // Map courses to their respective semester
    enrollments.forEach(e => {
        const semId = e.courseoffering.semesterid;
        const semName = e.courseoffering.semester.name;

        if (!semestersMap[semId]) {
            semestersMap[semId] = {
                semesterId: semId,
                semesterName: semName,
                gpa: 0,
                cgpa: 0,
                earnedCredits: 0,
                courses: []
            };
        }

        semestersMap[semId].courses.push({
            enrollmentId: e.courseenrollmentid,
            courseName: e.courseoffering.course.name,
            courseCode: e.courseoffering.course.code,
            credits: e.courseoffering.course.credits,
            grade: e.grade || 'N/A',
            gradepoints: e.gradepoints
        });
    });

    const semestersList = Object.values(semestersMap).sort((a, b) => a.semesterId - b.semesterId);

    // Summary calculations
    let totalEarnedCredits = 0;
    let totalPoints = 0;
    let completedCoursesCount = enrollments.length;

    enrollments.forEach(e => {
        const credits = e.courseoffering.course.credits;
        totalEarnedCredits += credits;
        if (e.gradepoints !== null) {
            totalPoints += e.gradepoints * credits;
        }
    });

    const cumulativeCgpa = totalEarnedCredits > 0 ? Number((totalPoints / totalEarnedCredits).toFixed(2)) : 0.0;

    return {
        student: {
            studentid: student.studentid,
            fullname: student.fullname || student.user.username,
            rollnumber: student.rollnumber || 'N/A',
            email: student.user.email,
            department: student.department?.name || 'N/A',
            departmentCode: student.department?.code || 'N/A',
            currentSemester: student.semester?.name || 'N/A',
            status: student.status
        },
        semesters: semestersList,
        summary: {
            totalCredits: totalEarnedCredits,
            cgpa: cumulativeCgpa,
            completedCourses: completedCoursesCount
        }
    };
};
