import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTicket } from '../api/ticketApi';
import { CreateTicketPayload, Ticket } from '../types';

export const useCreateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTicketPayload) => createTicket(payload),
    onSuccess: (data: Ticket) => {
      // Invalidate the tickets list to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
};
