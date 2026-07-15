import prisma from '../../config/prisma.js';

interface CreateNotificationParams {
  userId: number;
  title: string;
  message: string;
  type: string;
  actionUrl?: string;
  metadata?: any;
}

export const createNotification = async (params: CreateNotificationParams) => {
  const notification = await prisma.notification.create({
    data: {
      userid: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
      action_url: params.actionUrl,
      metadata: params.metadata || {}
    }
  });

  // TODO(Phase10): Wire a real notification provider (e.g., SendGrid/Twilio/WebSocket)
  console.log(`[EMAIL MOCK] Notification sent to User #${params.userId} - ${params.title}`);
  
  return notification;
};

export const getUserNotifications = async (userId: number, limit: number = 20) => {
  return await prisma.notification.findMany({
    where: { userid: userId },
    orderBy: { createdat: 'desc' },
    take: limit
  });
};

export const markNotificationRead = async (notificationId: number) => {
  return await prisma.notification.update({
    where: { notificationid: notificationId },
    data: { isread: true }
  });
};

export const markAllNotificationsRead = async (userId: number) => {
  return await prisma.notification.updateMany({
    where: { userid: userId, isread: false },
    data: { isread: true }
  });
};
