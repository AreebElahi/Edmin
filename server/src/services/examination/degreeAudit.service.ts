import prisma from '../../config/prisma.js';
import { createAuditEntry } from '../workflows/shared/audit.service.js';

export const getDegreeAuditsList = async () => {
    // 1. Fetch audits
    const audits = await prisma.degreeaudit.findMany({
        include: {
            student: {
                include: {
                    user: true,
                    department: true,
                    semester: true
                }
            }
        }
    });

    return audits.map(a => ({
        degreeauditid: a.degreeauditid,
        studentId: a.studentid,
        studentName: a.student.fullname || a.student.user.username,
        rollnumber: a.student.rollnumber || 'N/A',
        department: a.student.department?.name || 'N/A',
        currentSemester: a.student.semester?.name || 'N/A',
        requiredCredits: a.requiredcredits,
        earnedCredits: a.earnedcredits,
        remainingCredits: a.remainingcredits,
        eligible: a.eligible,
        status: a.status
    }));
};

export const reevaluateAllDegreeAudits = async (adminUserId: number) => {
    const students = await prisma.student.findMany({
        include: {
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

    const results = [];

    for (const student of students) {
        const completed = student.courseenrollment.filter(e => e.status === 'COMPLETED');
        
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
        const requiredCredits = 130; // standard graduation requirement
        const remainingCredits = Math.max(0, requiredCredits - earnedCredits);
        const eligible = earnedCredits >= requiredCredits && cgpa >= 2.0;
        const status = eligible ? 'ELIGIBLE' : 'NOT_ELIGIBLE';

        const audit = await prisma.degreeaudit.upsert({
            where: { studentid: student.studentid },
            update: {
                requiredcredits: requiredCredits,
                earnedcredits: earnedCredits,
                remainingcredits: remainingCredits,
                eligible: eligible,
                status: status
            },
            create: {
                studentid: student.studentid,
                requiredcredits: requiredCredits,
                earnedcredits: earnedCredits,
                remainingcredits: remainingCredits,
                eligible: eligible,
                status: status
            }
        });

        results.push(audit);
    }

    await createAuditEntry(adminUserId, 'REEVALUATE_DEGREE_AUDITS', 'degreeaudit', adminUserId, { count: students.length });

    return results;
};
