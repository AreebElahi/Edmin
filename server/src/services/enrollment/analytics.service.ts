import prisma from '../../config/prisma.js';

export const getSectionStatistics = async (departmentId?: number, semesterId?: number) => {
  const sections = await prisma.section.findMany({
    where: {
      isactive: true,
      ...(departmentId ? { departmentid: departmentId } : {}),
      ...(semesterId ? { semesterid: semesterId } : {})
    },
    include: {
      _count: {
        select: { student: true }
      }
    }
  });

  let totalStudents = 0;
  let totalCapacity = 0;
  let fullSections = 0;
  let sectionsWithSeats = 0;

  for (const section of sections) {
    const studentCount = section._count.student;
    totalStudents += studentCount;
    totalCapacity += section.capacity;
    
    if (studentCount >= section.capacity) {
      fullSections++;
    } else {
      sectionsWithSeats++;
    }
  }

  const occupancyPercentage = totalCapacity > 0 ? (totalStudents / totalCapacity) * 100 : 0;

  const waitlistedStudents = await prisma.student.count({
    where: {
      status: 'WAITLISTED',
      ...(departmentId ? { departmentid: departmentId } : {}),
      ...(semesterId ? { semesterid: semesterId } : {})
    }
  });

  return {
    totalStudents,
    totalCapacity,
    occupancyPercentage: Number(occupancyPercentage.toFixed(2)),
    fullSections,
    sectionsWithSeats,
    waitlistedStudents
  };
};

export const getDepartmentStatistics = async (departmentId: number) => {
  const department = await prisma.department.findUnique({
    where: { departmentid: departmentId },
    select: { name: true, code: true }
  });

  if (!department) throw new Error('Department not found');

  const programsCount = await prisma.program.count({
    where: { departmentid: departmentId, isactive: true }
  });

  const sectionsCount = await prisma.section.count({
    where: { departmentid: departmentId, isactive: true }
  });

  const activeStudentsCount = await prisma.student.count({
    where: { departmentid: departmentId, isactive: true, status: 'ACTIVE' }
  });

  return {
    department: department.name,
    programs: programsCount,
    sections: sectionsCount,
    activeStudents: activeStudentsCount
  };
};

export const getProgramStatistics = async (programId: number) => {
  const program = await prisma.program.findUnique({
    where: { programid: programId },
    select: { name: true, code: true }
  });

  if (!program) throw new Error('Program not found');

  const sections = await prisma.section.findMany({
    where: { programid: programId, isactive: true },
    include: {
      _count: { select: { student: true } }
    }
  });

  let totalStudents = 0;
  let totalCapacity = 0;

  sections.forEach(s => {
    totalStudents += s._count.student;
    totalCapacity += s.capacity;
  });

  const capacityUsage = totalCapacity > 0 ? (totalStudents / totalCapacity) * 100 : 0;

  // Simulate an enrollment trend simply based on active vs inactive/waitlisted right now
  const waitlisted = await prisma.student.count({
    where: { programid: programId, status: 'WAITLISTED' }
  });

  return {
    program: program.name,
    capacityUsage: Number(capacityUsage.toFixed(2)),
    enrollmentTrend: {
      active: totalStudents,
      waitlisted,
      capacity: totalCapacity
    }
  };
};

export const getWaitlistStatistics = async (departmentId?: number) => {
  const waitlistedStudents = await prisma.student.findMany({
    where: {
      status: 'WAITLISTED',
      ...(departmentId ? { departmentid: departmentId } : {})
    },
    orderBy: { createdat: 'asc' },
    select: { createdat: true }
  });

  const totalWaitlisted = waitlistedStudents.length;
  let oldestWaitlistDate = null;
  let averageWaitTimeHours = 0;

  if (totalWaitlisted > 0) {
    oldestWaitlistDate = waitlistedStudents[0].createdat;
    
    const now = new Date().getTime();
    let totalWaitTimeMs = 0;
    
    waitlistedStudents.forEach(s => {
      totalWaitTimeMs += (now - new Date(s.createdat).getTime());
    });
    
    averageWaitTimeHours = (totalWaitTimeMs / totalWaitlisted) / (1000 * 60 * 60);
  }

  return {
    totalWaitlisted,
    oldestWaitlisted: oldestWaitlistDate,
    averageWaitTimeHours: Number(averageWaitTimeHours.toFixed(2))
  };
};
