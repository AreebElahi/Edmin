import { PrismaClient } from '@prisma/client';
import { getAssignments } from './src/services/faculty/facultyAssessment.service.ts';

async function main() {
  try {
    const assignments = await getAssignments(1);
    console.log(JSON.stringify(assignments, null, 2));
  } catch(e) {
    console.error(e);
  }
}

main().then(() => process.exit(0));
