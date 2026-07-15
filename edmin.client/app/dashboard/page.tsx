'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';

export default function DashboardIndex() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === 'ADMIN' || user.role === 'SYSTEM_ADMIN') {
        router.push('/dashboard/admin');
      } else if (user.role === 'HR') {
        router.push('/dashboard/hr');
      } else if (user.role === 'FACULTY') {
        router.push('/dashboard/faculty');
      } else if (user.role === 'STUDENT') {
        router.push('/dashboard/student');
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  return null;
}
