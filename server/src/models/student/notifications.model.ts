import prisma from '../../config/prisma.js';

export const findNotificationsByStudentId = async (userId: number) => {
  return prisma.notification.findMany({
    where: { userid: userId, isactive: true },
    orderBy: { createdat: 'desc' },
  });
};

export const findNotificationById = async (notificationId: number) => {
  return prisma.notification.findFirst({
    where: { notificationid: notificationId, isactive: true },
  });
};

export const markNotificationAsRead = async (notificationId: number) => {
  return prisma.notification.update({
    where: { notificationid: notificationId },
    data: {
      isread: true,
      updatedat: new Date(),
    },
  });
};
