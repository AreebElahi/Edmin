'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { useStudent } from '../app/dashboard/student/StudentContext';
import { Spinner, MessageBar, MessageBarTitle, MessageBarBody } from '@fluentui/react-components';
import { useStudentStyles } from '@/hooks/useStudentStyles';

interface StudentPageStateProps {
  loading: boolean;
  error: string | null;
  loadingLabel?: string;
  errorTitle?: string;
  layoutWrapper?: boolean;
  currentPath?: string;
  children: React.ReactNode;
}

export default function StudentPageState({
  loading,
  error,
  loadingLabel = 'Loading...',
  errorTitle = 'An error occurred',
  layoutWrapper = true,
  currentPath,
  children,
}: StudentPageStateProps) {
  const styles = useStudentStyles();
  let studentData: ReturnType<typeof useStudent> | null = null;
  
  try {
    studentData = useStudent();
  } catch (e) {
    // Fail-safe if used outside of StudentProvider
  }

  const userName = studentData?.profile?.student?.fullname || 'Student';
  const notifications = studentData?.notifications || [];

  const mappedNotifications = notifications.map((n) => ({
    id: n.notificationid.toString(),
    title: n.title,
    message: n.message,
    timestamp: new Date(n.createdat),
    read: n.isread,
    type: 'info' as const,
  }));

  if (loading) {
    const spinner = (
      <div className={styles.loadingContainer}>
        <Spinner size="large" label={loadingLabel} />
      </div>
    );

    return layoutWrapper ? (
      <DashboardLayout
        userRole={UserRole.STUDENT}
        userName={userName}
        notifications={mappedNotifications}
        currentPath={currentPath}
      >
        {spinner}
      </DashboardLayout>
    ) : (
      spinner
    );
  }

  if (error) {
    const errorBar = (
      <div className={styles.errorContainer}>
        <MessageBar intent="error">
          <MessageBarTitle>{errorTitle}</MessageBarTitle>
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      </div>
    );

    return layoutWrapper ? (
      <DashboardLayout
        userRole={UserRole.STUDENT}
        userName={userName}
        notifications={mappedNotifications}
        currentPath={currentPath}
      >
        {errorBar}
      </DashboardLayout>
    ) : (
      errorBar
    );
  }

  return <>{children}</>;
}
