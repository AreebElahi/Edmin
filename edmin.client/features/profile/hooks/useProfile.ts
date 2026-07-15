import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getMyProfile,
  updateMyProfile,
  UserProfile,
  UpdateProfilePayload,
  uploadAvatar,
  getAvatar,
} from '../api/profileApi';

export const PROFILE_QUERY_KEY = ['profile', 'me'] as const;
export const AVATAR_QUERY_KEY = ['profile', 'avatar'] as const;

/** Fetches the enriched profile from GET /auth/me. Cached 5 min. */
export function useCurrentProfile() {
  return useQuery<UserProfile, Error>({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: async () => {
      const data = await getMyProfile();
      if (data && data.role) {
        data.role = data.role.toLowerCase();
      }
      return data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Fetches the avatar for the current user.
 * Faculty/Student → DB. Admin/HR → localStorage (no avatar column in their tables).
 */
export function useAvatar(userId?: number, role?: string) {
  return useQuery<string | null, Error>({
    queryKey: [...AVATAR_QUERY_KEY, userId],
    queryFn: async () => {
      if (role === 'ADMIN' || role === 'SYSTEM_ADMIN' || role === 'HR') {
        if (typeof window !== 'undefined') {
          return localStorage.getItem(`avatar_${userId}`) ?? null;
        }
        return null;
      }
      const result = await getAvatar();
      return result.avatar;
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Mutation: upload a base64 avatar.
 * Faculty/Student → PATCH /auth/avatar (saved in DB).
 * Admin/HR        → localStorage only.
 */
export function useUploadAvatar(userId?: number, role?: string) {
  const queryClient = useQueryClient();

  return useMutation<string, Error, string>({
    mutationFn: async (base64: string) => {
      if (role === 'ADMIN' || role === 'SYSTEM_ADMIN' || role === 'HR') {
        if (typeof window !== 'undefined' && userId) {
          localStorage.setItem(`avatar_${userId}`, base64);
        }
        return base64;
      }
      const result = await uploadAvatar(base64);
      return result.avatar;
    },
    onSuccess: (avatarDataUrl) => {
      queryClient.setQueryData([...AVATAR_QUERY_KEY, userId], avatarDataUrl);
      toast.success('Profile photo updated!');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to upload photo. Try a smaller image.');
    },
  });
}

/** Mutation: update editable profile fields (phone, etc.) */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, UpdateProfilePayload>({
    mutationFn: updateMyProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      toast.success('Profile updated successfully!');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update profile. Please try again.');
    },
  });
}
