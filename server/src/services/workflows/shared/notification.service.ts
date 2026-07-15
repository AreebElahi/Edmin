import prisma from '../../../config/prisma.js';

export const emitWorkflowNotification = async (
  userId: number,
  title: string,
  message: string,
  type = 'INFO',
  actionUrl?: string,
  metadata?: any
) => {
  return await prisma.notification.create({
    data: {
      userid: userId,
      title,
      message,
      type,
      action_url: actionUrl,
      metadata: metadata || {}
    }
  });
};
