import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findFirst({ where: { email: 'student@edmin.com' } });
  if (!user) throw new Error("User not found");
  const notifications = await prisma.notification.findMany({
    where: { userid: user.userid }
  });
  console.log("Notifications for student:", notifications.length);
  console.log(notifications);
  await prisma.$disconnect();
}
main();
