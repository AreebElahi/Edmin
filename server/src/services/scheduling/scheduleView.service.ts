import prisma from '../../config/prisma.js';

const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const groupSlotsByDay = (slots: any[]) => {
  const result: any = {};
  for (const day of daysOfWeek) {
    const daySlots = slots.filter(s => s.dayofweek === day);
    if (daySlots.length > 0) {
      result[day] = daySlots.map(s => ({
        course: s.courseoffering.course.code,
        section: s.section.name,
        time: `${new Date(s.starttime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(s.endtime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
        room: s.room.code,
        delivery: s.delivery,
        meetingurl: s.meetingurl
      }));
    }
  }
  return result;
};

export const getStudentTimetable = async (studentId: number, semesterId: number) => {
  const enrollments = await prisma.courseenrollment.findMany({
    where: { studentid: studentId, status: 'ENROLLED', courseoffering: { semesterid: semesterId } }
  });

  const offeringIds = enrollments.map(e => e.courseofferingid);

  const slots = await prisma.timetableslot.findMany({
    where: { offeringid: { in: offeringIds }, status: 'ACTIVE' },
    include: { room: true, courseoffering: { include: { course: true } }, section: true },
    orderBy: { starttime: 'asc' }
  });

  return groupSlotsByDay(slots);
};

export const getFacultyTimetable = async (facultyId: number, semesterId: number) => {
  const slots = await prisma.timetableslot.findMany({
    where: { status: 'ACTIVE', courseoffering: { instructorid: facultyId, semesterid: semesterId } },
    include: { room: true, courseoffering: { include: { course: true } }, section: true },
    orderBy: { starttime: 'asc' }
  });

  return groupSlotsByDay(slots);
};

export const getRoomTimetable = async (roomId: number, semesterId: number) => {
  const slots = await prisma.timetableslot.findMany({
    where: { status: 'ACTIVE', roomid: roomId, courseoffering: { semesterid: semesterId } },
    include: { room: true, courseoffering: { include: { course: true } }, section: true },
    orderBy: { starttime: 'asc' }
  });

  return groupSlotsByDay(slots);
};

export const getSectionTimetable = async (sectionId: number, semesterId: number) => {
  const slots = await prisma.timetableslot.findMany({
    where: { status: 'ACTIVE', sectionid: sectionId, courseoffering: { semesterid: semesterId } },
    include: { room: true, courseoffering: { include: { course: true } }, section: true },
    orderBy: { starttime: 'asc' }
  });

  return groupSlotsByDay(slots);
};
