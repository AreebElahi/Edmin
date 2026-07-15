import { Queue } from 'bullmq';
import { redisConnection } from './redis.js';

export { redisConnection };

export const auditQueue = redisConnection ? new Queue('AuditQueue', { connection: redisConnection }) : null;
export const broadcastQueue = redisConnection ? new Queue('BroadcastQueue', { connection: redisConnection }) : null;

if (auditQueue) {
  auditQueue.on('error', (err) => {
    console.warn('[Queue Warning] AuditQueue connection issue:', err.message);
  });
}
if (broadcastQueue) {
  broadcastQueue.on('error', (err) => {
    console.warn('[Queue Warning] BroadcastQueue connection issue:', err.message);
  });
}

// Helper function used by Services to fire-and-forget
export const dispatchAuditEvent = async (payload: any) => {
  if (auditQueue) {
    await auditQueue.add('logAction', payload, { 
      removeOnComplete: true, 
      removeOnFail: false, // Dead Letter Queue strategy
      attempts: 5,
      backoff: { type: 'exponential', delay: 2000 }
    });
  }
};
