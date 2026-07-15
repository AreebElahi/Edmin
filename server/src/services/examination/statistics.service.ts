import prisma from '../../config/prisma.js';

export const getExaminationStatistics = async () => {
    // 1. Fetch all students for top performing listing
    const students = await prisma.student.findMany({
        include: {
            user: true,
            department: true,
            courseenrollment: {
                include: {
                    courseoffering: {
                        include: {
                            course: true
                        }
                    }
                }
            }
        }
    });

    const studentsStats = students.map(s => {
        const completed = s.courseenrollment.filter(e => e.status === 'COMPLETED');
        
        let earnedCredits = 0;
        let totalPoints = 0;
        completed.forEach(e => {
            const cr = e.courseoffering?.course?.credits || 3;
            earnedCredits += cr;
            if (e.gradepoints !== null) {
                totalPoints += e.gradepoints * cr;
            }
        });

        const cgpa = earnedCredits > 0 ? Number((totalPoints / earnedCredits).toFixed(2)) : 0.0;

        return {
            studentName: s.fullname || s.user.username,
            rollnumber: s.rollnumber || 'N/A',
            department: s.department?.name || 'N/A',
            cgpa,
            earnedCredits
        };
    }).filter(s => s.earnedCredits > 0);

    // Sort for top performers
    const topPerformers = [...studentsStats]
        .sort((a, b) => b.cgpa - a.cgpa)
        .slice(0, 10);

    // 2. Department GPA averages
    const deptMap: Record<string, { totalGpa: number; count: number }> = {};
    studentsStats.forEach(s => {
        if (!deptMap[s.department]) {
            deptMap[s.department] = { totalGpa: 0, count: 0 };
        }
        deptMap[s.department].totalGpa += s.cgpa;
        deptMap[s.department].count++;
    });

    const departmentGpaAverages = Object.entries(deptMap).map(([dept, data]) => ({
        departmentName: dept,
        avgGpa: Number((data.totalGpa / data.count).toFixed(2))
    })).sort((a, b) => b.avgGpa - a.avgGpa);

    // 3. Course Pass Rates & High Failure Courses
    const courses = await prisma.course.findMany({
        include: {
            courseoffering: {
                include: {
                    courseenrollment: true
                }
            }
        }
    });

    const courseStats = courses.map(c => {
        let totalCompleted = 0;
        let totalPassed = 0;

        c.courseoffering.forEach(co => {
            co.courseenrollment.forEach(ce => {
                if (ce.status === 'COMPLETED') {
                    totalCompleted++;
                    if (ce.grade && ce.grade !== 'F') {
                        totalPassed++;
                    }
                }
            });
        });

        const passRate = totalCompleted > 0 ? Number(((totalPassed / totalCompleted) * 100).toFixed(1)) : 100.0;
        const failRate = totalCompleted > 0 ? Number((100 - passRate).toFixed(1)) : 0.0;

        return {
            courseCode: c.code,
            courseName: c.name,
            completedCount: totalCompleted,
            passRate,
            failRate
        };
    }).filter(c => c.completedCount > 0);

    const passRates = [...courseStats]
        .sort((a, b) => b.passRate - a.passRate);

    const highFailureCourses = [...courseStats]
        .sort((a, b) => b.failRate - a.failRate)
        .slice(0, 5);

    return {
        departmentGpaAverages,
        passRates,
        topPerformers,
        highFailureCourses
    };
};
