import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const user = await prisma.user.findUnique({ where: { username: 'faculty_user1' } });
  if (!user) {
    console.log('faculty_user1 not found!');
    return;
  }
  const faculty = await prisma.faculty.findUnique({ where: { userid: user.userid } });
  if (!faculty) {
    console.log('faculty profile not found for faculty_user1');
    return;
  }
  
  const dept = await prisma.department.findFirst();
  if (dept) {
    await prisma.department.update({
      where: { departmentid: dept.departmentid },
      data: { hodid: faculty.facultyid }
    });
    console.log(`Successfully made ${user.username} the HOD of ${dept.name}`);
  } else {
    console.log('No departments found.');
  }
}

run().finally(() => prisma.$disconnect());
