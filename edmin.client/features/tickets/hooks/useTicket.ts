import { useQuery } from '@tanstack/react-query';
import { getTicketById } from '../api/ticketApi';

export const useTicket = (id: number) => {
  return useQuery({
    queryKey: ['tickets', id],
    queryFn: () => getTicketById(id),
    staleTime: 1000 * 60, // 1 minute
    enabled: !!id,
  });
};
