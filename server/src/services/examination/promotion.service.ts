import prisma from '../../config/prisma.js';
import { createAuditEntry } from '../workflows/shared/audit.service.js';

export const getPromotionRecommendations = async () => {
    const students = await prisma.student.findMany({
        include: {
            user: true,
            department: true,
            semester: true,
            courseenrollment: {
                include: {
                    courseoffering: {
                        include: {
                            course: true
                        }
                    }
                }
            },
            semesterrecord: {
                orderBy: {
                    semester: {
                        startdate: 'desc'
                    }
                },
                take: 1
            }
        }
    });

    const recommendations = students.map(s => {
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
        const failedCount = s.courseenrollment.filter(e => e.grade === 'F').length;

        // Current Standing from latest Semester Record
        const latestRecord = s.semesterrecord[0];
        const currentStanding = latestRecord ? latestRecord.standing : 'GOOD_STANDING';

        // Evaluate standing & status recommendation
        let recommendedStanding: 'GOOD_STANDING' | 'WARNING' | 'PROBATION' | 'SUSPENDED' = 'GOOD_STANDING';
        let recommendedStatus: 'ACTIVE' | 'ALUMNI' | 'SUSPENDED' = 'ACTIVE';
        let statusReason = 'Good Standing';

        if (earnedCredits >= 130 && cgpa >= 2.0) {
            recommendedStatus = 'ALUMNI'; // Graduated
            statusReason = 'Graduation Eligible (Completed 130+ Credits)';
        } else if (cgpa < 1.7 && earnedCredits > 0) {
            recommendedStanding = 'PROBATION';
            statusReason = 'Repeat Semester Recommended (CGPA < 1.7)';
        } else if (cgpa < 2.0 && earnedCredits > 0) {
            recommendedStanding = 'WARNING';
            statusReason = 'Academic Probation (CGPA < 2.0)';
        }

        return {
            studentId: s.studentid,
            fullname: s.fullname || s.user.username,
            rollnumber: s.rollnumber || 'N/A',
            departmentName: s.department?.name || 'N/A',
            currentSemester: s.semester?.name || 'N/A',
            currentStatus: s.status || 'ACTIVE',
            currentStanding,
            earnedCredits,
            cgpa,
            failedCount,
            recommendedStanding,
            recommendedStatus,
            statusReason
        };
    });

    return recommendations;
};

export const executePromotionOrGraduation = async (studentId: number, data: { status: string; standing: string; comment?: string }, adminUserId: number) => {
    const student = await prisma.student.findUnique({
        where: { studentid: studentId }
    });

    if (!student) throw new Error('Student not found');

    const oldStatus = student.status;

    // 1. Update Student status
    const updatedStudent = await prisma.student.update({
        where: { studentid: studentId },
        data: {
            status: data.status as any
        }
    });

    // 2. Fetch active/latest semester for the student to update standing
    const latestRecord = await prisma.semesterrecord.findFirst({
        where: { studentid: studentId },
        orderBy: { createdat: 'desc' }
    });

    if (latestRecord) {
        await prisma.semesterrecord.update({
            where: { semesterrecordid: latestRecord.semesterrecordid },
            data: {
                standing: data.standing as any
            }
        });
    }

    // 3. Log administrative action
    await createAuditEntry(adminUserId, 'ACADEMIC_STANDING_OVERRIDE', 'student', studentId, {
        status: data.status,
        standing: data.standing,
        comment: data.comment,
        oldStatus,
        oldStanding: latestRecord?.standing || 'GOOD_STANDING'
    });

    return updatedStudent;
};
