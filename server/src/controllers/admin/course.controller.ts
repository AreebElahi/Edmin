import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../contracts/api.contracts.js';
import { parseNumber } from '../../utils/queryParser.js';
import * as CourseService from '../../services/admin/course.service.js';
import { getCachedResponse, setCachedResponse } from "../../config/redis.js";

export const getAllCoursesHandler = async (req: Request, res: Response) => {
    try {
        const courses = await CourseService.getAllCourses();
        return sendSuccess(res, courses);
    } catch (error: any) {
        return sendError(res, error.message, 'INTERNAL_ERROR', 500);
    }
};

export const createCourseHandler = async (req: Request, res: Response) => {
    try {
        const { code, name, credits, basecapacity, description, departmentIds } = req.body;
        
        if (!code || !name || !credits || !basecapacity) {
            return sendError(res, 'Missing required fields', 'BAD_REQUEST', 400);
        }

        const newCourse = await CourseService.createCourse({
            code,
            name,
            credits: Number(credits),
            basecapacity: Number(basecapacity),
            description,
            departmentIds: departmentIds || []
        });

        return sendSuccess(res, newCourse, 'Operation completed successfully.', undefined, 201);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return sendError(res, 'Course code already exists', 'BAD_REQUEST', 400);
        }
        return sendError(res, error.message, 'INTERNAL_ERROR', 500);
    }
};

export const updateCourseHandler = async (req: Request, res: Response) => {
    try {
        const courseid = parseNumber(req.params.id, 0);
        const { code, name, credits, basecapacity, description, departmentIds } = req.body;

        if (!courseid) {
            return sendError(res, 'Course ID is required', 'BAD_REQUEST', 400);
        }

        const updatedCourse = await CourseService.updateCourse(courseid, {
            code,
            name,
            credits: Number(credits),
            basecapacity: Number(basecapacity),
            description,
            departmentIds
        });

        return sendSuccess(res, updatedCourse);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return sendError(res, 'Course code already exists', 'BAD_REQUEST', 400);
        }
        return sendError(res, error.message, 'INTERNAL_ERROR', 500);
    }
};

export const toggleCourseStatusHandler = async (req: Request, res: Response) => {
    try {
        const courseid = parseNumber(req.params.id, 0);
        const { isactive } = req.body;

        if (!courseid || typeof isactive !== 'boolean') {
            return sendError(res, 'Invalid request data', 'BAD_REQUEST', 400);
        }

        const updatedCourse = await CourseService.toggleCourseStatus(courseid, isactive);
        return sendSuccess(res, updatedCourse);
    } catch (error: any) {
        return sendError(res, error.message, 'INTERNAL_ERROR', 500);
    }
};
