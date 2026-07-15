import { useInfiniteQuery } from '@tanstack/react-query';
import { getInfiniteTickets, TicketQueryParams } from '../api/ticketApi';

export const useInfiniteTickets = (params?: Omit<TicketQueryParams, 'cursor'>) => {
  return useInfiniteQuery({
    queryKey: ['tickets', 'infinite', params],
    queryFn: ({ pageParam }) => getInfiniteTickets({ ...params, cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    staleTime: 1000 * 60, // 1 minute
  });
};
