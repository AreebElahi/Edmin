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
