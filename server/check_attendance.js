import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const attendance = await prisma.attendance.findMany({
    where: { studentid: 1 } // user 3 has studentid 1
  });
  console.log('Attendance records:', attendance);
  const summary = await prisma.attendancesummary.findMany({
    where: { studentid: 1 }
  });
  console.log('Attendance summary:', summary);
}
main().catch(console.error).finally(() => prisma.$disconnect());
