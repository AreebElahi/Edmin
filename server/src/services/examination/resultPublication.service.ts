import prisma from '../../config/prisma.js';
import { calculateGrade } from './gradeCalculation.service.js';
import { createAuditEntry } from '../workflows/shared/audit.service.js';

export const lockAssessmentMarks = async (assessmentId: number, adminUserId: number) => {
    // 1. Mark all assessment results as locked
    await prisma.assessmentresult.updateMany({
        where: { assessmentid: assessmentId },
        data: { islocked: true }
    });

    // 2. Update assessment status to LOCKED
    const updated = await prisma.assessment.update({
        where: { assessmentid: assessmentId },
        data: { 
            status: 'LOCKED',
            updatedby: adminUserId
        }
    });

    // 3. Log administrative action
    await createAuditEntry(adminUserId, 'LOCK_ASSESSMENT_MARKS', 'assessment', assessmentId, { oldStatus: 'PUBLISHED', newStatus: 'LOCKED' });

    return updated;
};

export const publishCourseGrades = async (offeringId: number, adminUserId: number) => {
    // Fetch course offering details
    const offering = await prisma.courseoffering.findUnique({
        where: { courseofferingid: offeringId },
        include: {
            course: true,
            semester: true,
            assessment: {
                where: { status: 'LOCKED' } // Only compute with locked assessments
            },
            courseenrollment: {
                include: {
                    student: true
                }
            }
        }
    });

    if (!offering) throw new Error('Course offering not found');

    const assessments = offering.assessment;
    const enrollments = offering.courseenrollment;

    if (assessments.length === 0) {
        throw new Error('No locked assessments found for this course offering. Cannot publish grades.');
    }

    const totalWeight = assessments.reduce((acc, a) => acc + a.weight, 0);

    const publishedResults = [];

    // Loop through enrolled students
    for (const enrollment of enrollments) {
        const studentId = enrollment.studentid;
        
        let totalWeightedScore = 0;
        let earnedPoints = 0;

        for (const ass of assessments) {
            const result = await prisma.assessmentresult.findUnique({
                where: {
                    assessmentid_studentid: {
                        assessmentid: ass.assessmentid,
                        studentid: studentId
                    }
                }
            });

            const obtained = result ? result.obtainedmarks : 0;
            const maxMarks = ass.totalmarks || 100;
            
            // weighted marks contribution
            const weightedScore = (obtained / maxMarks) * ass.weight;
            totalWeightedScore += weightedScore;
        }

        // Normalize if total weight of locked assessments is not 100 (e.g. scale up proportionately)
        let finalPercentage = totalWeightedScore;
        if (totalWeight > 0 && totalWeight !== 100) {
            finalPercentage = (totalWeightedScore / totalWeight) * 100;
        }

        // Compute Grade
        const { grade, gradepoints } = await calculateGrade(finalPercentage);

        // Update Course Enrollment
        const updatedEnroll = await prisma.courseenrollment.update({
            where: { courseenrollmentid: enrollment.courseenrollmentid },
            data: {
                status: 'COMPLETED',
                grade: grade,
                gradepoints: gradepoints
            }
        });

        publishedResults.push(updatedEnroll);

        // Recalculate Semester Record for this student
        await recalculateSemesterRecord(studentId, offering.semesterid);
    }

    // Log administrative action
    await createAuditEntry(adminUserId, 'PUBLISH_COURSE_GRADES', 'courseoffering', offeringId, { status: 'COMPLETED_AND_GRADED', totalStudents: enrollments.length });

    return {
        message: `Successfully calculated and published grades for ${enrollments.length} students.`,
        publishedCount: enrollments.length
    };
};

export const recalculateSemesterRecord = async (studentId: number, semesterId: number) => {
    // 1. Fetch completed course enrollments for this student in this semester
    const semEnrollments = await prisma.courseenrollment.findMany({
        where: {
            studentid: studentId,
            status: 'COMPLETED',
            courseoffering: {
                semesterid: semesterId
            }
        },
        include: {
            courseoffering: {
                include: {
                    course: true
                }
            }
        }
    });

    let semCreditsTotal = 0;
    let semPointsTotal = 0;

    semEnrollments.forEach(e => {
        const credits = e.courseoffering?.course?.credits || 3;
        semCreditsTotal += credits;
        if (e.gradepoints !== null) {
            semPointsTotal += e.gradepoints * credits;
        }
    });

    const semesterGpa = semCreditsTotal > 0 ? Number((semPointsTotal / semCreditsTotal).toFixed(2)) : 0.0;

    // 2. Fetch all completed course enrollments across all semesters to calculate CGPA
    const allEnrollments = await prisma.courseenrollment.findMany({
        where: {
            studentid: studentId,
            status: 'COMPLETED'
        },
        include: {
            courseoffering: {
                include: {
                    course: true
                }
            }
        }
    });

    let totalCredits = 0;
    let totalPoints = 0;

    allEnrollments.forEach(e => {
        const credits = e.courseoffering?.course?.credits || 3;
        totalCredits += credits;
        if (e.gradepoints !== null) {
            totalPoints += e.gradepoints * credits;
        }
    });

    const cgpa = totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0.0;

    // 3. Determine Academic Standing
    let standing: 'GOOD_STANDING' | 'WARNING' | 'PROBATION' | 'SUSPENDED' = 'GOOD_STANDING';
    if (cgpa < 1.7 && totalCredits > 0) {
        standing = 'PROBATION';
    } else if (cgpa < 2.0 && totalCredits > 0) {
        standing = 'WARNING';
    }

    // 4. Update or Insert Semester Record
    await prisma.semesterrecord.upsert({
        where: {
            studentid_semesterid: {
                studentid: studentId,
                semesterid: semesterId
            }
        },
        update: {
            totalcredits: semCreditsTotal,
            earnedcredits: semCreditsTotal, // Completed course credits
            semestergpa: semesterGpa,
            cgpa: cgpa,
            standing: standing
        },
        create: {
            studentid: studentId,
            semesterid: semesterId,
            totalcredits: semCreditsTotal,
            earnedcredits: semCreditsTotal,
            semestergpa: semesterGpa,
            cgpa: cgpa,
            standing: standing
        }
    });
};

export const getPublishedResults = async () => {
    // Query course offerings where at least one enrollment is marked as completed
    const offerings = await prisma.courseoffering.findMany({
        where: {
            courseenrollment: {
                some: {
                    status: 'COMPLETED'
                }
            }
        },
        include: {
            course: true,
            semester: true,
            faculty: {
                include: {
                    user: true
                }
            },
            courseenrollment: true
        }
    });

    const results = offerings.map(o => {
        const completed = o.courseenrollment.filter(e => e.status === 'COMPLETED');
        const passed = completed.filter(e => e.grade && e.grade !== 'F');
        
        let totalGpa = 0;
        let gradedCount = 0;

        completed.forEach(e => {
            if (e.gradepoints !== null) {
                totalGpa += e.gradepoints;
                gradedCount++;
            }
        });

        const avgGpa = gradedCount > 0 ? Number((totalGpa / gradedCount).toFixed(2)) : 0.0;
        const passRate = completed.length > 0 ? Number(((passed.length / completed.length) * 100).toFixed(1)) : 100.0;

        return {
            offeringId: o.courseofferingid,
            courseName: o.course.name,
            courseCode: o.course.code,
            semester: o.semester.name,
            instructorName: o.faculty?.fullname || o.faculty?.user?.username || 'N/A',
            enrolledCount: o.courseenrollment.length,
            completedCount: completed.length,
            avgGpa,
            passRate,
            publishedAt: o.updatedat || new Date()
        };
    });

    return results;
};
