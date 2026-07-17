import { Request, Response } from 'express';
import { NotificationService } from './notification.service.js';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    const notifications = await NotificationService.getUserNotifications(userId, limit);

    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const notificationId = parseInt(req.params.id as string, 10);

    await NotificationService.markAsRead(notificationId, userId);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;

    await NotificationService.markAllAsRead(userId);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
