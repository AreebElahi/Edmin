import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'uzmaparveen@edmin.com' }
  });
  console.log('User:', user);

  if (user) {
    const faculty = await prisma.faculty.findFirst({
      where: { userid: user.userid }
    });
    console.log('Faculty:', faculty);
    
    if (!faculty) {
      console.log('Creating faculty record...');
      const newFaculty = await prisma.faculty.create({
        data: {
          userid: user.userid,
          fullname: 'Uzma Parveen',
          departmentid: 1, // fallback
          employeenumber: 'F' + user.userid
        }
      });
      console.log('Created:', newFaculty);
    }
  }
}

main().finally(() => prisma.$disconnect());
