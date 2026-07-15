import { useMutation, useQueryClient } from '@tanstack/react-query';
import { resolveTicket } from '../api/ticketApi';
import { ResolveTicketPayload, Ticket } from '../types';

export const useResolveTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ResolveTicketPayload }) => resolveTicket(id, payload),
    onMutate: async ({ id, payload }) => {
      // 1. Cancel any outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ['tickets', id] });

      // 2. Snapshot the previous value
      const previousTicket = queryClient.getQueryData<Ticket>(['tickets', id]);

      // 3. Optimistically update to the new value
      if (previousTicket) {
        queryClient.setQueryData<Ticket>(['tickets', id], {
          ...previousTicket,
          status: 'RESOLVED',
          version: previousTicket.version + 1, // Predict OCC increment
        });
      }

      // Return a context with the snapshotted value to rollback if necessary
      return { previousTicket };
    },
    onError: (err: any, variables, context) => {
      // If mutation fails, use the context to rollback
      if (context?.previousTicket) {
        queryClient.setQueryData(['tickets', variables.id], context.previousTicket);
      }
      
      // Specifically handle OCC Conflicts (409)
      if (err?.status === 409) {
        console.error('Optimistic Concurrency Conflict: Data was modified elsewhere.');
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success to ensure synchronization
      queryClient.invalidateQueries({ queryKey: ['tickets', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] }); // Invalidate lists
    },
  });
};
