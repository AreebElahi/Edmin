import prisma from '../../config/prisma.js';
import { eventHandlers } from './eventHandlers.js';

const BATCH_SIZE = 20;
const MAX_ATTEMPTS = 5;
const POLL_INTERVAL_MS = 5000;

export const processOutboxEvents = async () => {
  try {
    // Fetch pending events (not processed, under max attempts)
    const pendingEvents = await prisma.outboxEvent.findMany({
      where: {
        processed: false,
        attempt_count: { lt: MAX_ATTEMPTS }
      },
      orderBy: { created_at: 'asc' },
      take: BATCH_SIZE
    });

    if (pendingEvents.length === 0) return;

    for (const event of pendingEvents) {
      try {
        const handler = eventHandlers[event.event_type];
        
        if (handler) {
          // Payload is stored as JSON, Prisma returns it as an object
          await handler(event.payload);
        } else {
          console.warn(`[OutboxWorker] No handler found for event type: ${event.event_type}`);
        }

        // Mark processed
        await prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            processed: true,
            processed_at: new Date(),
            attempt_count: { increment: 1 }
          }
        });

      } catch (err: any) {
        console.error(`[OutboxWorker] Failed to process event ${event.id}:`, err);
        
        // Update attempt count and last error
        await prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            attempt_count: { increment: 1 },
            last_error: err.message || 'Unknown error'
          }
        });
      }
    }
  } catch (error) {
    console.error('[OutboxWorker] Fatal error during outbox polling:', error);
  }
};

let workerRunning = false;

export const startWorker = async () => {
  if (workerRunning) return;
  workerRunning = true;
  console.log('[OutboxWorker] Started listening for OutboxEvents...');

  while (true) {
    await processOutboxEvents();
    // sleep for interval
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }
};
