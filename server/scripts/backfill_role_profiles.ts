import { backfillProfiles } from '../src/services/identity/profileProvisioning.service.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting historical backfill for role profiles...');
  try {
    const count = await backfillProfiles();
    console.log(`Successfully backfilled ${count} missing profiles.`);
  } catch (error) {
    console.error('Error during profile backfill:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
