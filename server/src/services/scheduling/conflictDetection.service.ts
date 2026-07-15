import prisma from '../../config/prisma.js';

interface ConflictParams {
  offeringId: number;
  sectionId: number;
  roomId: number;
  dayOfWeek: string;
  startTime: Date;
  endTime: Date;
}

export const checkConflicts = async (params: ConflictParams) => {
  const { offeringId, sectionId, roomId, dayOfWeek, startTime, endTime } = params;

  const offering = await prisma.courseoffering.findUnique({
    where: { courseofferingid: offeringId },
    include: { 
      semester: true,
      course: true,
      faculty: {
        include: {
          user: true
        }
      }
    }
  });

  if (!offering) throw new Error('Offering not found');
  const semesterId = offering.semesterid;

  // Find all active slots for this semester and day
  const existingSlots = await prisma.timetableslot.findMany({
    where: {
      status: 'ACTIVE',
      dayofweek: dayOfWeek as any,
      courseoffering: {
        semesterid: semesterId
      }
    },
    include: {
      courseoffering: {
        include: {
          course: true,
          faculty: {
            include: {
              user: true
            }
          }
        }
      },
      room: true,
      section: true
    }
  });

  // Time overlap logic
  const isOverlap = (sTime1: Date, eTime1: Date, sTime2: Date, eTime2: Date) => {
    const t1s = sTime1.getTime();
    const t1e = eTime1.getTime();
    const t2s = sTime2.getTime();
    const t2e = eTime2.getTime();
    return t1s < t2e && t2s < t1e;
  };

  for (const slot of existingSlots) {
    if (isOverlap(startTime, endTime, slot.starttime, slot.endtime)) {
      // 1. Room Conflict
      if (slot.roomid === roomId) {
        const roomName = slot.room?.name || 'selected venue';
        const courseCode = slot.courseoffering?.course?.code || 'N/A';
        const courseName = slot.courseoffering?.course?.name || 'N/A';
        const teacherName = slot.courseoffering?.faculty?.user?.username || 'Unassigned';
        throw new Error(`Room conflict: "${roomName}" is already booked for course "${courseName} (${courseCode})" taught by ${teacherName} at this time.`);
      }

      // 2. Section Conflict
      if (slot.sectionid === sectionId) {
        const sectionName = slot.section?.name || `Section ${sectionId}`;
        const courseCode = slot.courseoffering?.course?.code || 'N/A';
        const courseName = slot.courseoffering?.course?.name || 'N/A';
        throw new Error(`Section conflict: "${sectionName}" is already scheduled for course "${courseName} (${courseCode})" at this time.`);
      }

      // 3. Faculty Conflict (Same Instructor)
      if (offering.instructorid && slot.courseoffering.instructorid === offering.instructorid) {
        const teacherName = offering.faculty?.user?.username || 'Instructor';
        const courseCode = slot.courseoffering?.course?.code || 'N/A';
        const courseName = slot.courseoffering?.course?.name || 'N/A';
        const roomName = slot.room?.name || 'a room';
        throw new Error(`Faculty conflict: Instructor "${teacherName}" is already scheduled to teach course "${courseName} (${courseCode})" in "${roomName}" at this time.`);
      }
    }
  }

  // 4. Capacity Validation
  const room = await prisma.room.findUnique({ where: { roomid: roomId } });
  if (!room) throw new Error('Room not found');

  const studentCount = await prisma.student.count({
    where: {
      courseenrollment: {
        some: {
          courseofferingid: offeringId,
          status: 'ENROLLED'
        }
      }
    }
  });

  if (studentCount > room.capacity) {
    throw new Error(`Capacity conflict: Section size (${studentCount}) exceeds room capacity (${room.capacity})`);
  }

  return true;
};
