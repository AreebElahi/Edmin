import { apiGet, apiPost, apiPatch, apiDelete } from '../../../api/apiContract';
import { 
  Ticket, 
  TicketPaginatedResponse, 
  CreateTicketPayload,
  StaffMember,
  ResolveTicketPayload, 
  AssignTicketPayload, 
  CreateTicketMessagePayload 
} from '../types';

export interface TicketQueryParams {
  status?: string;
  priority?: string;
  assignee?: number;
  cursor?: string;
  limit?: number;
}

export const createTicket = (payload: CreateTicketPayload): Promise<Ticket> =>
  apiPost<Ticket>('/admin/tickets', payload);

export const getAssignableStaff = (): Promise<StaffMember[]> =>
  apiGet<StaffMember[]>('/admin/staff');

export const getTickets = (params?: TicketQueryParams): Promise<Ticket[]> =>
  apiGet<Ticket[]>('/admin/tickets', { params });

export const getInfiniteTickets = (params?: TicketQueryParams): Promise<TicketPaginatedResponse> =>
  apiGet<TicketPaginatedResponse>('/admin/tickets', { params });

export const getTicketById = (id: number): Promise<Ticket> =>
  apiGet<Ticket>(`/admin/tickets/${id}`);

export const resolveTicket = (id: number, payload: ResolveTicketPayload): Promise<Ticket> =>
  apiPatch<Ticket>(`/admin/tickets/${id}/status`, {
    status: 'RESOLVED',
    resolutionText: payload.resolutionText,
    version: payload.version
  });

export const assignTicket = (id: number, payload: AssignTicketPayload): Promise<Ticket> =>
  apiPatch<Ticket>(`/admin/tickets/${id}/assign`, payload);

export const createMessage = (id: number, payload: CreateTicketMessagePayload): Promise<any> =>
  apiPost<any>(`/admin/tickets/${id}/messages`, payload);
