import prisma from '../../config/prisma.js';

export const createRoom = async (data: { name: string; code: string; capacity: number; building?: string }) => {
  return prisma.room.create({
    data
  });
};

export const getRooms = async () => {
  return prisma.room.findMany({
    where: { isactive: true }
  });
};

export const updateRoom = async (roomId: number, data: Partial<{ name: string; code: string; capacity: number; building: string; isactive: boolean }>) => {
  return prisma.room.update({
    where: { roomid: roomId },
    data
  });
};
