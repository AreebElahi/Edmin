import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const keys = Object.keys(prisma) as string[];
console.log("Has approval:", keys.includes('approval') || keys.includes('workflow'));
console.log("Has recruitment:", keys.includes('recruitment') || keys.includes('jobapplication'));
console.log("Has promotion:", keys.includes('promotion'));
console.log("Has employee:", keys.includes('employee'));
