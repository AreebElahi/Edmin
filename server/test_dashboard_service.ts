import { getStudentDashboardData } from './src/services/dashboardService.js';
import prisma from './src/config/prisma.js';

async function main() {
  const user: any = await prisma.user.findFirst({ where: { email: 'student@edmin.com' } });
  if (!user) throw new Error("No user");
  const data = await getStudentDashboardData(user.userid);
  console.log(JSON.stringify(data.courses, null, 2));
  await prisma.$disconnect();
}
main();
