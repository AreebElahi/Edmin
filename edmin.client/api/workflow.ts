import { apiGet, apiPost } from './apiContract';

export interface WorkflowEvent {
  id: number;
  aggregate_type: string;
  aggregate_id: number;
  event_type: string;
  payload: any;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  created_at: string;
  processed_at?: string;
  attempt_count: number;
  last_error?: string;
}

export interface FetchWorkflowEventsParams {
  page?: number;
  limit?: number;
  status?: string;
  eventType?: string;
  aggregateType?: string;
  aggregateId?: number;
}

export interface WorkflowEventsResponse {
  events: WorkflowEvent[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const fetchWorkflowEvents = (params: FetchWorkflowEventsParams): Promise<WorkflowEventsResponse> => {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page.toString());
  if (params.limit) query.append('limit', params.limit.toString());
  if (params.status) query.append('status', params.status);
  if (params.eventType) query.append('eventType', params.eventType);
  if (params.aggregateType) query.append('aggregateType', params.aggregateType);
  if (params.aggregateId) query.append('aggregateId', params.aggregateId.toString());
  return apiGet<WorkflowEventsResponse>(`/admin/workflow/events?${query.toString()}`);
};

export const replayWorkflowEvent = (eventId: number): Promise<WorkflowEvent> =>
  apiPost<WorkflowEvent>(`/admin/workflow/events/${eventId}/replay`);

export const forceRetryWorkflowEvent = (eventId: number): Promise<WorkflowEvent> =>
  apiPost<WorkflowEvent>(`/admin/workflow/events/${eventId}/force-retry`);

export const resolveWorkflowEvent = (eventId: number): Promise<WorkflowEvent> =>
  apiPost<WorkflowEvent>(`/admin/workflow/events/${eventId}/resolve`);

export const injectWorkflowEvent = (payload: { event_type: string; aggregate_type: string; aggregate_id: number; payload: any }): Promise<WorkflowEvent> =>
  apiPost<WorkflowEvent>('/admin/workflow/events/inject', payload);

