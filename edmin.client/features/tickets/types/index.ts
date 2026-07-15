import { z } from 'zod';
import { 
  CreateTicketSchema, 
  ResolveTicketSchema, 
  AssignTicketSchema, 
  CreateTicketMessageSchema 
} from '../schemas';

// Mirroring the Backend Prisma Models precisely
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TicketSource = 'MANUAL' | 'AUTOMATED';

export interface UserSnippet {
  userid: number;
  name: string;
  email: string;
}

export interface TicketMessage {
  id: number;
  ticket_id: number;
  sender_id: number;
  content: string;
  is_internal: boolean;
  created_at: string;
  sender?: UserSnippet;
}

export interface Ticket {
  id: number;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  source_type: TicketSource;
  entity_type: string | null;
  entity_id: number | null;
  requester_id: number;
  assignee_id: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  version: number;
  
  requester?: UserSnippet;
  assignee?: UserSnippet;
  messages?: TicketMessage[];
}

export interface TicketPaginatedResponse {
  tickets: Ticket[];
  nextCursor?: string;
  total: number;
}

// Infer types from Zod schemas for form submissions
export type CreateTicketPayload = z.infer<typeof CreateTicketSchema>;
export type ResolveTicketPayload = z.infer<typeof ResolveTicketSchema>;
export type AssignTicketPayload = z.infer<typeof AssignTicketSchema>;
export type CreateTicketMessagePayload = z.infer<typeof CreateTicketMessageSchema>;

export interface StaffMember {
  id: number;
  name: string;
  departmentRole: string;
}
