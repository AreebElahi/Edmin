import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const courseOfferingId = 1;

  // Insert some timetables for MON, WED, FRI
  await prisma.timetable.create({
    data: {
      courseofferingid: courseOfferingId,
      dayofweek: 'MON',
      starttime: '1970-01-01T09:00:00Z',
      endtime: '1970-01-01T10:30:00Z',
      room: 'Room 101',
      isactive: true
    }
  });

  await prisma.timetable.create({
    data: {
      courseofferingid: courseOfferingId,
      dayofweek: 'WED',
      starttime: '1970-01-01T09:00:00Z',
      endtime: '1970-01-01T10:30:00Z',
      room: 'Room 101',
      isactive: true
    }
  });

  await prisma.timetable.create({
    data: {
      courseofferingid: courseOfferingId,
      dayofweek: 'FRI',
      starttime: '1970-01-01T11:00:00Z',
      endtime: '1970-01-01T12:30:00Z',
      room: 'Lab 1',
      isactive: true
    }
  });

  console.log('Timetables seeded successfully!');
  await prisma.$disconnect();
}

main().catch(console.error);
