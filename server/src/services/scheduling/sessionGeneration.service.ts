import prisma from '../../config/prisma.js';

export const generateClassSessions = async (semesterId: number) => {
  const semester = await prisma.semester.findUnique({
    where: { semesterid: semesterId }
  });

  if (!semester) throw new Error('Semester not found');
  if (!semester.startdate || !semester.enddate) {
    throw new Error('Semester startdate and enddate must be set to generate sessions');
  }

  const holidays = await prisma.academicevent.findMany({
    where: { type: 'HOLIDAY' }
  });

  const isHoliday = (date: Date) => {
    return holidays.some(h => date >= h.startdate && date <= h.enddate);
  };

  const slots = await prisma.timetableslot.findMany({
    where: {
      status: 'ACTIVE',
      courseoffering: {
        semesterid: semesterId
      }
    }
  });

  const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  let totalCreated = 0;

  for (const slot of slots) {
    const targetDayIndex = daysOfWeek.indexOf(slot.dayofweek);
    let currentDate = new Date(semester.startdate);

    // advance to the first occurrence of this day
    while (currentDate.getDay() !== targetDayIndex) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const sessionDates = [];

    while (currentDate <= semester.enddate) {
      if (!isHoliday(currentDate)) {
        sessionDates.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 7);
    }

    for (const date of sessionDates) {
      // Upsert to ensure idempotency (unique constraint: timetableslotid, sessiondate)
      try {
        await prisma.classsession.upsert({
          where: {
            timetableslotid_sessiondate: {
              timetableslotid: slot.timetableslotid,
              sessiondate: date
            }
          },
          update: {}, // do nothing if it already exists
          create: {
            courseofferingid: slot.offeringid,
            timetableslotid: slot.timetableslotid,
            sessiondate: date,
            starttime: slot.starttime,
            endtime: slot.endtime,
            status: 'SCHEDULED'
          }
        });
        totalCreated++;
      } catch (err) {
        // If upsert fails for some weird unique constraint issue not covered
        console.error(err);
      }
    }
  }

  return { message: `Generated ${totalCreated} new class sessions.` };
};
