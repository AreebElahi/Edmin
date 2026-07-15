import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createMessage } from '../api/ticketApi';
import { CreateTicketMessagePayload, Ticket } from '../types';

export const useCreateMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CreateTicketMessagePayload }) => createMessage(id, payload),
    onSettled: (data, error, variables) => {
      // Invalidate the specific ticket so the message list refreshes
      queryClient.invalidateQueries({ queryKey: ['tickets', variables.id] });
    },
  });
};
