import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync.js';
import prisma from '../config/prisma.js';
import { sendSuccess, sendError } from "../contracts/api.contracts.js";
import { getCachedResponse, setCachedResponse } from "../config/redis.js";

// Get all assessments for a course, with results for a specific student if requested
export const getCourseAssessments = catchAsync(async (req: Request, res: Response) => {
    const { courseId } = req.params;
    const { studentId } = req.query;

    const offeringId = parseInt(courseId as string);
    if (isNaN(offeringId)) {
        return sendError(res, 'Internal error', [], 400);
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

    sendSuccess(res, assessments, undefined, undefined, 200);
});

// Update or create an assessment result for a student
export const updateAssessmentResult = catchAsync(async (req: Request, res: Response) => {
    const { assessmentId } = req.params;
    const { studentId, obtainedMarks, remarks } = req.body;

    const pAssessmentId = parseInt(assessmentId as string);
    const pStudentId = parseInt(studentId);

    if (isNaN(pAssessmentId) || isNaN(pStudentId)) {
        return sendError(res, 'Internal error', [], 400);
    }

    if (obtainedMarks === undefined || obtainedMarks === null || isNaN(parseFloat(obtainedMarks))) {
        return sendError(res, 'Internal error', [], 400);
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

    sendSuccess(res, result, undefined, undefined, 200);
});
