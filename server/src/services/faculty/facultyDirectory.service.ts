import prisma from '../../config/prisma.js';

export const getFacultyDirectory = async () => {
  const faculties = await prisma.faculty.findMany({
    include: {
      user: true,
      department: {
        include: {
          user: {
            include: { faculty: true }
          },
          supervisor: {
            include: { faculty: true }
          }
        }
      },
      courseoffering: {
        include: {
          course: true
        }
      }
    }
  });

  return faculties.map((fac: any) => {
    const hodName = fac.department?.user?.faculty?.fullname || fac.department?.user?.username || 'N/A';
    const supervisorName = fac.department?.supervisor?.faculty?.fullname || fac.department?.supervisor?.username || 'N/A';

    return {
      facultyid: fac.facultyid,
      employeenumber: fac.employeenumber || 'N/A',
      fullname: fac.fullname || fac.user.username,
      email: fac.user.email,
      institutionalEmail: fac.user.institutionalEmail || 'N/A',
      role: fac.user.role,
      accountStatus: fac.user.accountStatus,
      department: fac.department?.name || 'N/A',
      departmentCode: fac.department?.code || 'N/A',
      hodName,
      supervisorName,
      assignedCourses: fac.courseoffering.map((co: any) => ({
        courseofferingid: co.courseofferingid,
        code: co.course.code,
        name: co.course.name,
        credits: co.course.credits
      })),
      isactive: fac.isactive
    };
  });
};
