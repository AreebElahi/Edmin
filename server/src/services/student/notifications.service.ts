import {
  findNotificationsByStudentId,
  findNotificationById,
  markNotificationAsRead,
} from '../../models/student/notifications.model.js';
import { AppError } from '../../utils/AppError.js';

export const getNotifications = async (userId: number) => {
  return findNotificationsByStudentId(userId);
};

export const markAsRead = async (userId: number, notificationId: number) => {
  const notif = await findNotificationById(notificationId);
  if (!notif) {
    throw new AppError(404, 'Notification not found');
  }

  // Verify ownership
  if (notif.userid !== userId) {
    throw new AppError(403, 'Forbidden: You do not own this notification');
  }

  return markNotificationAsRead(notificationId);
};
