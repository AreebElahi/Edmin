import { useCurrentProfile } from '@/features/profile/hooks/useProfile';

export interface CurrentUser {
  userId: number;
  email: string;
  role: string;
  roles?: string[];
  firstName?: string;
  lastName?: string;
  fullName?: string;
  mustChangePassword?: boolean;
  designation?: string;
}

export const useCurrentUser = () => {
  const query = useCurrentProfile();
  return {
    ...query,
    data: query.data as CurrentUser | undefined
  };
};
