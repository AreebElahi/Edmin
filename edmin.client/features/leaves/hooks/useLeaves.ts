import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch } from '@/api/apiContract';

export interface LeaveRequest {
  leaverequestid: number;
  userid: number;
  leavetype: string;
  startdate: string;
  enddate: string;
  reason: string;
  status: string;
  createdat: string;
  user?: {
    fullname?: string;
    username?: string;
    department?: string;
  };
}

export const useLeaves = () => {
  return useQuery<LeaveRequest[], Error>({
    queryKey: ['leaves'],
    queryFn: async () => {
      return await apiGet<LeaveRequest[]>('/leaves');
    }
  });
};

export const useApproveLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (leaveId: number) => {
      return await apiPatch(`/leaves/${leaveId}/approve`, { status: 'APPROVED' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      alert("Successfully approved leave!");
    },
    onError: (err: any) => {
        alert(`Error approving leave: ${err?.message || err}`);
        console.error(err);
    }
  });
};

export const useRejectLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (leaveId: number) => {
      return await apiPatch(`/leaves/${leaveId}/reject`, { status: 'REJECTED' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      alert("Successfully rejected leave!");
    },
    onError: (err: any) => {
        alert(`Error rejecting leave: ${err?.message || err}`);
        console.error(err);
    }
  });
};
