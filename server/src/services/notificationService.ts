import prisma from '../config/prisma.js';

export const createNotification = async (userId: number, title: string, message: string) => {
  return await prisma.notification.create({
    data: {
      userid: userId,
      title,
      message,
      isread: false,
      isactive: true,
      createdat: new Date(),
      updatedat: new Date(),
    },
  });
};

export const createBulkNotifications = async (userIds: number[], title: string, message: string) => {
  const data = userIds.map((userid) => ({
    userid,
    title,
    message,
    isread: false,
    isactive: true,
    createdat: new Date(),
    updatedat: new Date(),
  }));

  return await prisma.notification.createMany({
    data,
  });
};
