import { PrismaClient, assessment_type, assessment_status } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const offerings = await prisma.courseoffering.findMany();
    let count = 0;
    for (const offering of offerings) {
        // create Midterm
        await prisma.assessment.create({
            data: {
                offeringid: offering.courseofferingid,
                name: 'Midterm Exam',
                type: 'MIDTERM',
                totalmarks: 30,
                weight: 30,
                status: 'PUBLISHED'
            }
        });
        // create Final
        await prisma.assessment.create({
            data: {
                offeringid: offering.courseofferingid,
                name: 'Final Exam',
                type: 'FINAL',
                totalmarks: 50,
                weight: 50,
                status: 'PUBLISHED'
            }
        });
        count += 2;
    }
    console.log(`Created ${count} assessments for ${offerings.length} course offerings.`);
}
main().finally(() => prisma.$disconnect());
