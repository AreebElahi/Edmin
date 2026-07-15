'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StudentAPI } from '@/utils/api';
import * as StudentTypes from '@/types/student';

interface StudentContextType {
  profile: StudentTypes.ProfileResponse | null;
  notifications: StudentTypes.StudentNotification[];
  loading: boolean;
  error: string | null;
  refetchProfile: () => Promise<void>;
  refetchNotifications: () => Promise<void>;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<StudentTypes.ProfileResponse | null>(null);
  const [notifications, setNotifications] = useState<StudentTypes.StudentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await StudentAPI.getProfile();
      setProfile(data);
    } catch (err) {
      console.error('Failed to fetch student profile:', err);
      throw err;
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await StudentAPI.getNotifications();
      setNotifications(data || []);
    } catch (err) {
      console.error('Failed to fetch student notifications:', err);
      throw err;
    }
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchProfile(), fetchNotifications()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load student dashboard resources.');
    } finally {
      setLoading(false);
    }
  }, [fetchProfile, fetchNotifications]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const refetchProfile = async () => {
    try {
      await fetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update student profile.');
    }
  };

  const refetchNotifications = async () => {
    try {
      await fetchNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update student notifications.');
    }
  };

  return (
    <StudentContext.Provider
      value={{
        profile,
        notifications,
        loading,
        error,
        refetchProfile,
        refetchNotifications,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
}
