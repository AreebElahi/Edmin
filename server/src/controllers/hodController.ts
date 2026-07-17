import { Request, Response } from 'express';
import * as hodService from '../services/faculty/hod.service.js';

export const getHodDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'FACULTY') {
      res.status(403).json({ message: 'Unauthorized access' });
      return;
    }

    const userId = user.userId || user.userid;
    const data = await hodService.getDashboardStats(userId);

    res.status(200).json({
      success: true,
      data
    });
  } catch (error: any) {
    if (error.message === 'Not assigned as HOD to any department') {
      res.status(403).json({ message: error.message });
      return;
    }
    console.error('Error fetching HOD stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getHodFacultyActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user.userId || user.userid;
    
    const facultyActivity = await hodService.getFacultyActivity(userId);

    res.status(200).json({ success: true, data: facultyActivity });
  } catch (error: any) {
    if (error.message === 'Not an HOD') {
      res.status(403).json({ message: error.message });
      return;
    }
    console.error('Error fetching faculty activity:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUpcomingEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user.userId || user.userid;
    
    const events = await hodService.getUpcomingEvents(userId);

    res.status(200).json({ success: true, data: events });
  } catch (error: any) {
    if (error.message === 'Not an HOD') {
      res.status(403).json({ message: error.message });
      return;
    }
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getDepartmentCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user.userId || user.userid;
    const courses = await hodService.getDepartmentCourses(userId);
    res.status(200).json({ success: true, data: courses });
  } catch (error: any) {
    if (error.message === 'Not an HOD') return void res.status(403).json({ message: error.message });
    console.error('Error fetching department courses:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getDepartmentLeaves = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user.userId || user.userid;
    const leaves = await hodService.getDepartmentLeaves(userId);
    res.status(200).json({ success: true, data: leaves });
  } catch (error: any) {
    if (error.message === 'Not an HOD') return void res.status(403).json({ message: error.message });
    console.error('Error fetching department leaves:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getDepartmentTeachingLoads = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user.userId || user.userid;
    const loads = await hodService.getDepartmentTeachingLoads(userId);
    res.status(200).json({ success: true, data: loads });
  } catch (error: any) {
    if (error.message === 'Not an HOD') return void res.status(403).json({ message: error.message });
    console.error('Error fetching department teaching loads:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getDepartmentStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user.userId || user.userid;
    const students = await hodService.getDepartmentStudents(userId);
    res.status(200).json({ success: true, data: students });
  } catch (error: any) {
    if (error.message === 'Not an HOD') return void res.status(403).json({ message: error.message });
    console.error('Error fetching department students:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getDepartmentActivityReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user.userId || user.userid;
    const reports = await hodService.getDepartmentActivityReports(userId);
    res.status(200).json({ success: true, data: reports });
  } catch (error: any) {
    if (error.message === 'Not an HOD') return void res.status(403).json({ message: error.message });
    console.error('Error fetching department activity reports:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
