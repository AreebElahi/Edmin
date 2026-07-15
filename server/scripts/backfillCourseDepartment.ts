import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Course Department backfill...');

  // 1. Fetch all departmentcourse mappings
  const mappings = await prisma.departmentcourse.findMany();

  if (mappings.length === 0) {
    console.log('No departmentcourse mappings found to backfill.');
    return;
  }

  let updatedCount = 0;
  let skippedCount = 0;

  // 2. Update courses with their departmentid
  for (const mapping of mappings) {
    // Check if the course already has a departmentid set
    const course = await prisma.course.findUnique({
      where: { courseid: mapping.courseid }
    });

    if (course && !course.departmentid) {
      await prisma.course.update({
        where: { courseid: mapping.courseid },
        data: { departmentid: mapping.departmentid }
      });
      updatedCount++;
      console.log(`Updated course ${mapping.courseid} with departmentid ${mapping.departmentid}`);
    } else {
      skippedCount++;
    }
  }

  console.log(`Backfill complete! Updated: ${updatedCount}, Skipped: ${skippedCount}.`);
  console.log('Phase 3A backfill successful. You can now verify the data and eventually remove departmentcourse in Phase 3B.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
