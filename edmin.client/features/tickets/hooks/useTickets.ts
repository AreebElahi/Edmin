import { useQuery } from '@tanstack/react-query';
import { getTickets, TicketQueryParams } from '../api/ticketApi';

export const useTickets = (params?: TicketQueryParams) => {
  return useQuery({
    queryKey: ['tickets', params],
    queryFn: () => getTickets(params),
    staleTime: 1000 * 60, // 1 minute
  });
};
