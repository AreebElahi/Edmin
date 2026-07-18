import prisma from '../config/prisma.js';
import { redisConnection } from '../config/redis.js';

export const createNotification = async (userId: number, title: string, message: string) => {
  const result = await prisma.notification.create({
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

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del(`api:notifications:${userId}:20`);
    await redisConnection.del(`api:notifications:${userId}:5`);
  }

  return result;
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

  const result = await prisma.notification.createMany({
    data,
  });

  if (redisConnection && redisConnection.status === 'ready') {
    const keys = userIds.map(id => `api:notifications:${id}:20`);
    const keysDashboard = userIds.map(id => `api:notifications:${id}:5`);
    await redisConnection.del([...keys, ...keysDashboard]);
  }

  return result;
};
