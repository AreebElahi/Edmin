import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assignTicket } from '../api/ticketApi';
import { AssignTicketPayload, Ticket } from '../types';

export const useAssignTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AssignTicketPayload }) => assignTicket(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['tickets', id] });
      const previousTicket = queryClient.getQueryData<Ticket>(['tickets', id]);

      if (previousTicket) {
        queryClient.setQueryData<Ticket>(['tickets', id], {
          ...previousTicket,
          assignee_id: payload.assignee_id,
          status: 'IN_PROGRESS',
          version: previousTicket.version + 1,
        });
      }

      return { previousTicket };
    },
    onError: (err: any, variables, context) => {
      if (context?.previousTicket) {
        queryClient.setQueryData(['tickets', variables.id], context.previousTicket);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tickets', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
};
