import { Worker } from 'bullmq';

import { redisConnection } from '../config/queue.js';

import prisma from '../config/prisma.js';

// This worker processes events pushed to the AuditQueue asynchronously
const auditWorker = new Worker('AuditQueue', async (job) => {
  const { actorId, action, tableName, recordId, snapshot, outboxEventId } = job.data;
  
  await prisma.$transaction(async (tx) => {
    // 1. Idempotency Check
    if (outboxEventId) {
      const processed = await tx.processedEvent.findUnique({ where: { event_id: outboxEventId } });
      if (processed) {
        console.log(`Event ${outboxEventId} already processed. Skipping.`);
        return;
      }
      // Record as processed
      await tx.processedEvent.create({ data: { event_id: outboxEventId } });
    }

    // 2. Insert the actual Audit Log
    await tx.auditLog.create({
      data: {
        actor_id: actorId,
        action,
        table_name: tableName,
        record_id: recordId,
        snapshot
      }
    });
  });

  console.log(`Processed audit log for ${tableName}:${recordId}`);
}, { 
  connection: redisConnection,
  concurrency: 10 // Handle 10 jobs concurrently
});

auditWorker.on('failed', (job, err) => {
  console.error(`Audit Job failed for ${job?.id}:`, err);
});

auditWorker.on('error', (err) => {
  console.warn('[Worker Warning] auditWorker connection issue:', err.message);
});
