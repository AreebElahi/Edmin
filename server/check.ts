import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  try {
    const schedules = await prisma.examsession.findMany({
      include: {
        room: true,
        section: true,
        assessment: {
          include: {
            courseoffering: {
              include: {
                course: true,
                semester: true
              }
            }
          }
        },
        invigilations: {
          include: {
            faculty: true
          }
        }
      }
    });
    console.log('Schedules count:', schedules.length);
    if (schedules.length > 0) console.log(JSON.stringify(schedules[0], null, 2));
  } catch (e) {
    console.error(e);
  }
}
run();
