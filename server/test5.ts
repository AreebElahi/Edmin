import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findFirst({ where: { faculty: { departmentid: 2 } } });
  if (user) {
      await prisma.leaverequest.create({
          data: {
              userid: user.userid,
              leavetype: 'SICK',
              startdate: new Date(),
              enddate: new Date(),
              reason: 'Sick leave',
              status: 'PENDING'
          }
      });
      console.log('Created leave request for SE department (dept 2)');
  }
}
main();
