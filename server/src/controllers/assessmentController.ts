import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync.js';
import prisma from '../config/prisma.js';

// Get all assessments for a course, with results for a specific student if requested
export const getCourseAssessments = catchAsync(async (req: Request, res: Response) => {
    const { courseId } = req.params;
    const { studentId } = req.query;

    const offeringId = parseInt(courseId as string);
    if (isNaN(offeringId)) {
        return res.status(400).json({ success: false, error: 'Invalid course ID' });
    }

    const includeOptions: any = {};
    
    if (studentId) {
        const pStudentId = parseInt(studentId as string);
        if (!isNaN(pStudentId)) {
            includeOptions.assessmentresult = {
                where: { studentid: pStudentId }
            };
        }
    } else {
        // Include all results if no specific student is requested
        includeOptions.assessmentresult = true;
    }

    const assessments = await prisma.assessment.findMany({
        where: { offeringid: offeringId },
        include: includeOptions
    });

    res.status(200).json({ success: true, data: assessments });
});

// Update or create an assessment result for a student
export const updateAssessmentResult = catchAsync(async (req: Request, res: Response) => {
    const { assessmentId } = req.params;
    const { studentId, obtainedMarks, remarks } = req.body;

    const pAssessmentId = parseInt(assessmentId as string);
    const pStudentId = parseInt(studentId);

    if (isNaN(pAssessmentId) || isNaN(pStudentId)) {
        return res.status(400).json({ success: false, error: 'Invalid assessment or student ID' });
    }

    if (obtainedMarks === undefined || obtainedMarks === null || isNaN(parseFloat(obtainedMarks))) {
        return res.status(400).json({ success: false, error: 'Invalid marks' });
    }

    const result = await prisma.assessmentresult.upsert({
        where: {
            assessmentid_studentid: {
                assessmentid: pAssessmentId,
                studentid: pStudentId
            }
        },
        update: {
            obtainedmarks: parseFloat(obtainedMarks),
            remarks: remarks || ''
        },
        create: {
            assessmentid: pAssessmentId,
            studentid: pStudentId,
            obtainedmarks: parseFloat(obtainedMarks),
            remarks: remarks || ''
        }
    });

    res.status(200).json({ success: true, data: result });
});
