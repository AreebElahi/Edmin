import prisma from '../config/prisma.js';
import { redisConnection } from '../config/queue.js';
import { eventHandlers } from '../services/workflow/eventHandlers.js';

const BATCH_SIZE = 20;
const MAX_ATTEMPTS = 5;
const POLL_INTERVAL_MS = 5000;

export const processOutboxEvents = async () => {
  let hasLock = false;
  try {
    // 1. Concurrency Control (Redis Mutex Lock)
    if (redisConnection) {
      const lockAcquired = await redisConnection.set('lock:outboxPoller', '1', 'NX', 'PX', 10000); // 10s TTL
      if (!lockAcquired) return; // Another worker is actively polling
      hasLock = true;
    }

    // 2. Reap stale PROCESSING events (orphaned jobs)
    // We do this inside the lock. Since Redis lock TTL is 10s, any PROCESSING event
    // older than 5 minutes is definitely orphaned (either crashed or lost lock).
    const staleThreshold = new Date(Date.now() - 5 * 60 * 1000);
    const staleEvents = await prisma.outboxEvent.findMany({
      where: {
        status: 'PROCESSING',
        created_at: { lt: staleThreshold } // Note: Using created_at since outboxEvent lacks an updated_at field
      }
    });

    if (staleEvents.length > 0) {
      for (const stale of staleEvents) {
        const isFailed = stale.attempt_count >= MAX_ATTEMPTS;
        await prisma.outboxEvent.update({
          where: { id: stale.id },
          data: {
            status: isFailed ? 'FAILED' : 'PENDING',
            last_error: isFailed ? 'Max attempts exhausted after crash/orphan' : 'Requeued after orphan detection'
          }
        });
        console.warn(`[OutboxWorker] Reaped stale event ${stale.id} (type: ${stale.event_type}) -> ${isFailed ? 'FAILED' : 'PENDING'}`);
      }
    }

    // 3. Fetch pending events
    const events = await prisma.outboxEvent.findMany({
      where: {
        status: 'PENDING',
        attempt_count: { lt: MAX_ATTEMPTS }
      },
      orderBy: { created_at: 'asc' },
      take: BATCH_SIZE
    });

    if (events.length === 0) return;

    for (const event of events) {
      // Transition to PROCESSING
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: { status: 'PROCESSING' }
      });

      try {
        if (event.event_type.startsWith('TICKET_') && redisConnection) {
          await redisConnection.xadd('ticket_events', '*', 'payload', JSON.stringify(event.payload));
        }

        const handler = eventHandlers[event.event_type];
        if (handler) {
          await handler(event.payload);
        } else if (!event.event_type.startsWith('TICKET_')) {
          throw new Error(`No handler found for event type: ${event.event_type}`);
        }

        // Transition to COMPLETED
        await prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            status: 'COMPLETED',
            processed_at: new Date(),
            attempt_count: { increment: 1 }
          }
        });

      } catch (err: any) {
        console.error(`[OutboxWorker] Failed to process event ${event.id}:`, err);
        
        const newAttemptCount = event.attempt_count + 1;
        const newStatus = newAttemptCount >= MAX_ATTEMPTS ? 'FAILED' : 'PENDING';

        await prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            status: newStatus,
            attempt_count: newAttemptCount,
            last_error: err.message || 'Unknown error'
          }
        });
      }
    }
  } catch (error) {
    console.error('[OutboxWorker] Fatal error during outbox polling:', error);
  } finally {
    if (hasLock && redisConnection) {
      await redisConnection.del('lock:outboxPoller');
    }
  }
};

let workerRunning = false;

// We use an async loop rather than setInterval to prevent overlapping executions
export const startOutboxPoller = async () => {
  if (workerRunning) return;
  workerRunning = true;
  console.log('[OutboxWorker] Started listening for OutboxEvents...');

  while (true) {
    await processOutboxEvents();
    // sleep for interval
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }
};
