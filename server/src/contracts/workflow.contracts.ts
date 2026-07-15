/**
 * WORKFLOW ENGINE CONTRACT FREEZE (Phase 14B)
 * 
 * This file formally documents the lifecycle and rules of the Edmin Workflow Engine.
 * All backend and frontend clients MUST respect these contracts.
 */

export const WORKFLOW_RULES = {
  // 1. Core State Machine
  // The system strictly adheres to these 4 immutable states for OutboxEvents.
  STATES: {
    PENDING: 'PENDING',       // Waiting for poller pickup
    PROCESSING: 'PROCESSING', // Actively locked and executing
    COMPLETED: 'COMPLETED',   // Handler succeeded
    FAILED: 'FAILED'          // Exhausted max attempts
  },

  // 2. Retry Logic
  // A failing event transitions back to PENDING until max attempts are reached.
  MAX_ATTEMPTS: 5,
  POLL_INTERVAL_MS: 5000,
  
  // 3. Replay Rules
  // ONLY events in the FAILED state can be replayed.
  // Replaying resets attempt_count to 0 and transitions back to PENDING.
  
  // 4. Concurrency Guard
  // The system uses a strict Redis Mutex lock to ensure only ONE instance
  // of the polling loop executes at any given interval globally.
  REDIS_LOCK_KEY: 'lock:outboxPoller',
  REDIS_LOCK_TTL_MS: 10000, // 10 seconds TTL for crash recovery safety
};
