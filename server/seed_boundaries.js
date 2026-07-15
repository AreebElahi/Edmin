import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.gradeboundary.createMany({
    data: [
      { grade: 'A+', minpercentage: 90, maxpercentage: 100, gradepoints: 4.0 },
      { grade: 'A', minpercentage: 85, maxpercentage: 89.99, gradepoints: 4.0 },
      { grade: 'A-', minpercentage: 80, maxpercentage: 84.99, gradepoints: 3.7 },
      { grade: 'B+', minpercentage: 75, maxpercentage: 79.99, gradepoints: 3.3 },
      { grade: 'B', minpercentage: 70, maxpercentage: 74.99, gradepoints: 3.0 },
      { grade: 'B-', minpercentage: 65, maxpercentage: 69.99, gradepoints: 2.7 },
      { grade: 'C+', minpercentage: 60, maxpercentage: 64.99, gradepoints: 2.3 },
      { grade: 'C', minpercentage: 55, maxpercentage: 59.99, gradepoints: 2.0 },
      { grade: 'C-', minpercentage: 50, maxpercentage: 54.99, gradepoints: 1.7 },
      { grade: 'D', minpercentage: 45, maxpercentage: 49.99, gradepoints: 1.0 },
      { grade: 'F', minpercentage: 0, maxpercentage: 44.99, gradepoints: 0.0 }
    ]
  });
  console.log('Seeded grade boundaries.');
}
main().catch(console.error).finally(() => prisma.$disconnect());
