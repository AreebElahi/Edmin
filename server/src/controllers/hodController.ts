import { Request, Response } from 'express';
import * as hodService from '../services/faculty/hod.service.js';
import { sendSuccess, sendError } from "../contracts/api.contracts.js";
import { getCachedResponse, setCachedResponse } from "../config/redis.js";

export const getHodDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'FACULTY') {
      sendError(res, 'Unauthorized access', [], 403);
      return;
    }

    const userId = user.userId || user.userid;
    const data = await hodService.getDashboardStats(userId);

    sendSuccess(res, data, undefined, undefined, 200);
  } catch (error: any) {
    if (error.message === 'Not assigned as HOD to any department') {
      sendError(res, error.message, [], 403);
      return;
    }
    console.error('Error fetching HOD stats:', error);
    sendError(res, 'Internal server error', [], 500);
  }
};

export const getHodFacultyActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user.userId || user.userid;
    
    const facultyActivity = await hodService.getFacultyActivity(userId);

    sendSuccess(res, facultyActivity, undefined, undefined, 200);
  } catch (error: any) {
    if (error.message === 'Not an HOD') {
      sendError(res, error.message, [], 403);
      return;
    }
    console.error('Error fetching faculty activity:', error);
    sendError(res, 'Internal server error', [], 500);
  }
};

export const getUpcomingEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user.userId || user.userid;
    
    const events = await hodService.getUpcomingEvents(userId);

    sendSuccess(res, events, undefined, undefined, 200);
  } catch (error: any) {
    if (error.message === 'Not an HOD') {
      sendError(res, error.message, [], 403);
      return;
    }
    console.error('Error fetching upcoming events:', error);
    sendError(res, 'Internal server error', [], 500);
  }
};

export const getDepartmentCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user.userId || user.userid;
    const courses = await hodService.getDepartmentCourses(userId);
    sendSuccess(res, courses, undefined, undefined, 200);
  } catch (error: any) {
    if (error.message === 'Not an HOD') return void sendError(res, error.message, [], 403);
    console.error('Error fetching department courses:', error);
    sendError(res, 'Internal server error', [], 500);
  }
};

export const getDepartmentLeaves = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user.userId || user.userid;
    const leaves = await hodService.getDepartmentLeaves(userId);
    sendSuccess(res, leaves, undefined, undefined, 200);
  } catch (error: any) {
    if (error.message === 'Not an HOD') return void sendError(res, error.message, [], 403);
    console.error('Error fetching department leaves:', error);
    sendError(res, 'Internal server error', [], 500);
  }
};

export const getDepartmentTeachingLoads = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user.userId || user.userid;
    const loads = await hodService.getDepartmentTeachingLoads(userId);
    sendSuccess(res, loads, undefined, undefined, 200);
  } catch (error: any) {
    if (error.message === 'Not an HOD') return void sendError(res, error.message, [], 403);
    console.error('Error fetching department teaching loads:', error);
    sendError(res, 'Internal server error', [], 500);
  }
};

export const getDepartmentStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user.userId || user.userid;
    const students = await hodService.getDepartmentStudents(userId);
    sendSuccess(res, students, undefined, undefined, 200);
  } catch (error: any) {
    if (error.message === 'Not an HOD') return void sendError(res, error.message, [], 403);
    console.error('Error fetching department students:', error);
    sendError(res, 'Internal server error', [], 500);
  }
};

export const getDepartmentActivityReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user.userId || user.userid;
    const reports = await hodService.getDepartmentActivityReports(userId);
    sendSuccess(res, reports, undefined, undefined, 200);
  } catch (error: any) {
    if (error.message === 'Not an HOD') return void sendError(res, error.message, [], 403);
    console.error('Error fetching department activity reports:', error);
    sendError(res, 'Internal server error', [], 500);
  }
};
