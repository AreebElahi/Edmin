import prisma from '../../config/prisma.js';

export interface CalculatedGrade {
    grade: string;
    gradepoints: number;
}

export const calculateGrade = async (percentage: number): Promise<CalculatedGrade> => {
    try {
        const boundaries = await prisma.gradeboundary.findMany({
            orderBy: { minpercentage: 'desc' }
        });

        if (boundaries && boundaries.length > 0) {
            for (const bound of boundaries) {
                if (percentage >= bound.minpercentage && percentage <= bound.maxpercentage) {
                    return {
                        grade: bound.grade,
                        gradepoints: bound.gradepoints
                    };
                }
            }
        }
    } catch (err) {
        console.error('Error fetching grade boundaries:', err);
    }

    // Standard Fallback Boundaries
    if (percentage >= 90) return { grade: 'A', gradepoints: 4.0 };
    if (percentage >= 80) return { grade: 'B', gradepoints: 3.0 };
    if (percentage >= 70) return { grade: 'C', gradepoints: 2.0 };
    if (percentage >= 60) return { grade: 'D', gradepoints: 1.0 };
    return { grade: 'F', gradepoints: 0.0 };
};
