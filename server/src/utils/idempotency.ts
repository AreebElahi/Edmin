import { PrismaClient } from '@prisma/client';

/**
 * Guarantees that a specific operation executes exactly once.
 * To be used within a Prisma Transaction to ensure atomicity.
 * 
 * @param tx Prisma transaction client
 * @param eventId Unique identifier for the event (e.g., OutboxEvent.id)
 * @returns boolean true if safe to process, throws error if duplicate
 */
export const checkIdempotency = async (tx: any, eventId: number): Promise<boolean> => {
  const existing = await tx.processedEvent.findUnique({ where: { event_id: eventId } });
  
  if (existing) {
    throw new Error(`[IDEMPOTENCY] Event ${eventId} has already been processed.`);
  }

  // Claim the event
  await tx.processedEvent.create({ data: { event_id: eventId } });
  
  return true;
};
