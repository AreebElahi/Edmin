import { EventEmitter } from 'events';

class AppEventBus extends EventEmitter {}

export const eventBus = new AppEventBus();

// Define strong types for our events
export enum AppEvents {
  TICKET_CREATED = 'ticket.created',
  TICKET_UPDATED = 'ticket.updated',
  TICKET_ASSIGNED = 'ticket.assigned',
  MESSAGE_SENT = 'message.sent',
}

// Interfaces for the event payloads
export interface TicketCreatedPayload {
  ticketId: number;
  requesterId: number;
  subject: string;
}

export interface TicketUpdatedPayload {
  ticketId: number;
  userId: number;
  oldStatus: string;
  newStatus: string;
}

export interface TicketAssignedPayload {
  ticketId: number;
  assigneeId: number;
  assignedById: number;
}

export interface MessageSentPayload {
  messageId: number;
  sessionId: number;
  senderId: number;
  content: string;
  conversationType: string;
}
