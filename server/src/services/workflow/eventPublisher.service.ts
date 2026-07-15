import { Prisma } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { DomainEvent } from '../../contracts/events.js';

/**
 * Publishes an event reliably using the Transactional Outbox pattern.
 * MUST be called within an existing Prisma transaction to ensure atomicity.
 * 
 * @param tx Prisma transaction client
 * @param aggregateType The entity type (e.g. 'assessment', 'invoice')
 * @param aggregateId The ID of the entity
 * @param eventType The specific event (e.g. 'GRADES_PUBLISHED')
 * @param payload JSON data required by the handlers
 */
export const publishEvent = async (
  tx: any,
  aggregateType: string,
  aggregateId: number,
  eventType: DomainEvent,
  payload: any
) => {
  return await tx.outboxEvent.create({
    data: {
      aggregate_type: aggregateType,
      aggregate_id: aggregateId,
      event_type: eventType,
      payload: payload
    }
  });
};

export const publishEventStandalone = async (
  aggregateType: string,
  aggregateId: number,
  eventType: DomainEvent,
  payload: any
) => {
  return await prisma.outboxEvent.create({
    data: {
      aggregate_type: aggregateType,
      aggregate_id: aggregateId,
      event_type: eventType,
      payload: payload
    }
  });
};
