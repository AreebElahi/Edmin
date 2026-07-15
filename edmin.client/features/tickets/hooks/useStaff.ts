import { useQuery } from '@tanstack/react-query';
import { getAssignableStaff } from '../api/ticketApi';

export const useStaff = () => {
  return useQuery({
    queryKey: ['staff'],
    queryFn: getAssignableStaff,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
};
