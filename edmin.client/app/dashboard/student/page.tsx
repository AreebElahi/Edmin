'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { DashboardAPI } from '@/utils/api';
import { useStudent } from './StudentContext';
import { 
  makeStyles, 
  tokens, 
  shorthands,
  Title1, 
  Title3,
  Subtitle1,
  Text,
  Badge,
  Button,
  Spinner,
  MessageBar,
  MessageBarTitle,
  MessageBarBody
} from '@fluentui/react-components';
import { 
  BookOpenRegular, 
  ClockRegular,
  RewardRegular,
  CalendarCheckmarkRegular,
  ArrowRightRegular,
  DocumentFolderRegular,
  HatGraduationRegular
} from '@fluentui/react-icons';
import { useStudentStyles } from '@/hooks/useStudentStyles';

const useLocalStyles = makeStyles({
  welcomeCard: {
    position: 'relative',
    padding: '32px 24px',
    backgroundImage: `linear-gradient(135deg, ${tokens.colorBrandBackground}, ${tokens.colorBrandBackgroundHover})`,
    color: tokens.colorNeutralForegroundOnBrand,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow4,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  welcomeText: {
    color: tokens.colorNeutralForegroundOnBrand,
    fontWeight: tokens.fontWeightBold,
  },
  welcomeSubtitle: {
    color: tokens.colorBrandBackgroundInverted,
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '24px',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
  panel: {
    backgroundColor: tokens.colorNeutralBackground1,
    padding: '20px',
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow2,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    paddingBottom: '12px',
  },
  courseGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr',
    },
  },
  courseCard: {
    padding: '16px',
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    borderRadius: tokens.borderRadiusMedium,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    transitionProperty: 'all',
    transitionDuration: '200ms',
    ':hover': {
      boxShadow: tokens.shadow4,
      ...shorthands.borderColor(tokens.colorBrandStroke1),
    }
  },
  scheduleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  scheduleItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.borderLeft('4px', 'solid', tokens.colorBrandStroke1),
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    transitionProperty: 'all',
    transitionDuration: '200ms',
    ':hover': {
      ...shorthands.borderColor(tokens.colorBrandStroke1),
    }
  },
  notificationItem: {
    padding: '12px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    position: 'relative',
  },
  unreadIndicator: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '8px',
    height: '8px',
    backgroundColor: tokens.colorPaletteRedBackground3,
    borderRadius: '50%',
  }
});

interface StudentDashboardData {
  metrics: {
    activeCourses: number;
    pendingAssignments: number;
    submittedAssignments: number;
    overdueAssignments: number;
    upcomingQuizzes: number;
    completedQuizzes: number;
    attendancePercentage: number;
    gpa: number;
    unreadNotificationsCount: number;
  };
  courses: Array<{
    courseid: number;
    courseOfferingId: number;
    code: string;
    name: string;
    credits: number;
    semester: string;
  }>;
  assignments: Array<{
    assignmentid: number;
    title: string;
    duedate: string;
    maxmarks: number;
    courseCode: string;
    courseName: string;
    status: 'pending' | 'submitted' | 'overdue';
  }>;
  quizzes: Array<{
    quizid: number;
    title: string;
    duration: number;
    totalmarks: number;
    courseCode: string;
    courseName: string;
    attempted: boolean;
  }>;
  schedule: Array<{
    timetableid: number;
    dayofweek: string;
    starttime: string;
    endtime: string;
    room: string | null;
    courseCode: string;
    courseName: string;
  }>;
}

export default function StudentDashboard() {
  const router = useRouter();
  const styles = useStudentStyles();
  const localStyles = useLocalStyles();
  const { profile, notifications, loading: contextLoading, error: contextError } = useStudent();

  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await DashboardAPI.getStudentDashboard();
        setDashboardData(response || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const userName = profile?.student?.fullname || 'Student';
  const welcomeName = profile?.student?.fullname ? profile.student.fullname.split(' ')[0] : 'Student';
  const rollNumber = profile?.student?.rollnumber || 'N/A';

  const mappedNotifications = useMemo(() => notifications.map((n) => ({
    id: n.notificationid.toString(),
    title: n.title,
    message: n.message,
    timestamp: new Date(n.createdat),
    read: n.isread,
    type: 'info' as const
  })), [notifications]);

  if (loading || contextLoading) {
    return (
      <DashboardLayout userName="Loading..." userRole={UserRole.STUDENT} notifications={[]}>
        <div className={styles.loadingContainer}>
          <Spinner size="large" label="Loading student dashboard..." />
        </div>
      </DashboardLayout>
    );
  }

  if (error || contextError) {
    return (
      <DashboardLayout userName="Error" userRole={UserRole.STUDENT} notifications={[]}>
        <div className={styles.errorContainer}>
          <MessageBar intent="error">
            <MessageBarTitle>Dashboard Load Error</MessageBarTitle>
            <MessageBarBody>{error || contextError}</MessageBarBody>
          </MessageBar>
        </div>
      </DashboardLayout>
    );
  }

  const metrics = dashboardData?.metrics || {
    activeCourses: 0,
    pendingAssignments: 0,
    submittedAssignments: 0,
    overdueAssignments: 0,
    upcomingQuizzes: 0,
    completedQuizzes: 0,
    attendancePercentage: 0,
    gpa: 0,
    unreadNotificationsCount: 0
  };

  return (
    <DashboardLayout
      userRole={UserRole.STUDENT}
      userName={userName}
      notifications={mappedNotifications}
      currentPath="/dashboard/student"
    >
      <div className={styles.container}>
        {/* Welcome Jumbotron Banner */}
        <div className={localStyles.welcomeCard}>
          <Title1 className={localStyles.welcomeText}>Welcome back, {welcomeName}!</Title1>
          <Subtitle1 className={localStyles.welcomeSubtitle}>
            Roll Number: {rollNumber} • {profile?.student?.program?.name || 'Academic Degree Program'}
          </Subtitle1>
          <Text style={{ color: tokens.colorNeutralForegroundOnBrand, marginTop: '8px' }}>
            You have {metrics.pendingAssignments} pending assignments and {metrics.upcomingQuizzes} upcoming quizzes this week.
          </Text>
        </div>

        {/* Dashboard KPI Summaries */}
        <div className={styles.kpiContainer}>
          {/* GPA Card */}
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <Text className={styles.kpiTitle}>Academic GPA</Text>
              <HatGraduationRegular className={styles.kpiIcon} />
            </div>
            <div>
              <div className={styles.kpiValue}>{metrics.gpa.toFixed(2)}</div>
              <Text className={styles.kpiSubtext}>Cumulative average grade</Text>
            </div>
          </div>

          {/* Attendance Percentage Card */}
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <Text className={styles.kpiTitle}>Total Attendance</Text>
              <CalendarCheckmarkRegular className={styles.kpiIcon} />
            </div>
            <div>
              <div className={styles.kpiValue}>{metrics.attendancePercentage}%</div>
              <Text className={styles.kpiSubtext}>Average session participation</Text>
            </div>
          </div>

          {/* Enrolled Courses Card */}
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <Text className={styles.kpiTitle}>Active Courses</Text>
              <BookOpenRegular className={styles.kpiIcon} />
            </div>
            <div>
              <div className={styles.kpiValue}>{metrics.activeCourses}</div>
              <Text className={styles.kpiSubtext}>Registered course modules</Text>
            </div>
          </div>

          {/* Tasks/Assignments Pending Card */}
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <Text className={styles.kpiTitle}>Pending Tasks</Text>
              <ClockRegular className={styles.kpiIcon} />
            </div>
            <div>
              <div className={styles.kpiValue}>{metrics.pendingAssignments}</div>
              <Text className={styles.kpiSubtext}>Require submissions soon</Text>
            </div>
          </div>
        </div>

        {/* Main Dashboard Panels */}
        <div className={localStyles.dashboardGrid}>
          
          {/* Left Area - Enrolled Courses & Schedule */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* My Registered Courses */}
            <div className={localStyles.panel}>
              <div className={localStyles.panelHeader}>
                <Title3>My Courses</Title3>
                <Link href="/dashboard/student/enrollment">
                  <Button icon={<ArrowRightRegular />} size="small" appearance="subtle">Register</Button>
                </Link>
              </div>

              {dashboardData?.courses.length === 0 ? (
                <div className={styles.emptyState}>
                  <BookOpenRegular style={{ fontSize: '48px', color: tokens.colorNeutralStroke1 }} />
                  <Text block style={{ marginTop: '8px' }}>No enrolled courses found.</Text>
                </div>
              ) : (
                <div className={localStyles.courseGrid}>
                  {dashboardData?.courses.map((course, index) => (
                    <div 
                      key={`${course.courseid}-${index}`}
                      className={localStyles.courseCard}
                      onClick={() => router.push(`/dashboard/student/courses/${course.courseOfferingId}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div>
                        <Badge appearance="outline" size="small">{course.code}</Badge>
                        <Text size={400} weight="semibold" block style={{ marginTop: '4px' }}>
                          {course.name}
                        </Text>
                        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                          Credits: {course.credits} • {course.semester}
                        </Text>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                        <Button 
                          size="small" 
                          appearance="outline"
                          onClick={(e) => { e.stopPropagation(); router.push('/dashboard/student/attendance'); }}
                        >
                          Attendance
                        </Button>
                        <Button 
                          size="small" 
                          appearance="subtle"
                          onClick={(e) => { e.stopPropagation(); router.push('/dashboard/student/assignments'); }}
                        >
                          Assignments
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Deadlines (Assignments & Quizzes) */}
            <div className={localStyles.panel}>
              <div className={localStyles.panelHeader}>
                <Title3>Pending Coursework</Title3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link href="/dashboard/student/assignments">
                    <Button size="small" appearance="subtle">All Assignments</Button>
                  </Link>
                  <Link href="/dashboard/student/quizzes">
                    <Button size="small" appearance="subtle">All Quizzes</Button>
                  </Link>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Assignment Deadlines */}
                {dashboardData?.assignments.map((assignment) => (
                  <Link 
                    key={`ass-${assignment.assignmentid}`}
                    href={`/dashboard/student/assignments/${assignment.assignmentid}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div className={localStyles.listItem}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <DocumentFolderRegular style={{ fontSize: '24px', color: tokens.colorNeutralForeground3 }} />
                        <div>
                          <Text weight="semibold" block>{assignment.title}</Text>
                          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                            {assignment.courseCode} • Due: {new Date(assignment.duedate).toLocaleDateString()}
                          </Text>
                        </div>
                      </div>
                      <Badge color={assignment.status === 'submitted' ? 'success' : assignment.status === 'overdue' ? 'danger' : 'warning'}>
                        {assignment.status}
                      </Badge>
                    </div>
                  </Link>
                ))}

                {/* Quizzes list */}
                {dashboardData?.quizzes.map((quiz) => (
                  <Link 
                    key={`quiz-${quiz.quizid}`}
                    href={`/dashboard/student/quizzes/${quiz.quizid}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div className={localStyles.listItem}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <RewardRegular style={{ fontSize: '24px', color: tokens.colorNeutralForeground3 }} />
                        <div>
                          <Text weight="semibold" block>{quiz.title}</Text>
                          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                            {quiz.courseCode} • Duration: {quiz.duration} mins • {quiz.totalmarks} marks
                          </Text>
                        </div>
                      </div>
                      <Badge color={quiz.attempted ? 'success' : 'brand'}>
                        {quiz.attempted ? 'Attempted' : 'Quiz Open'}
                      </Badge>
                    </div>
                  </Link>
                ))}

                {dashboardData?.assignments.length === 0 && dashboardData?.quizzes.length === 0 && (
                  <div className={styles.emptyState}>
                    <Text>No pending assignments or quizzes found!</Text>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Area - Today's Schedule */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Daily Schedule */}
            <div className={localStyles.panel}>
              <div className={localStyles.panelHeader}>
                <Title3>Timetable Summary</Title3>
                <Link href="/dashboard/student/schedule">
                  <Button icon={<ArrowRightRegular />} size="small" appearance="subtle">View Schedule</Button>
                </Link>
              </div>

              {dashboardData?.schedule.length === 0 ? (
                <div className={styles.emptyState}>
                  <Text>No scheduled sessions this week.</Text>
                </div>
              ) : (
                <div className={localStyles.scheduleList}>
                  {dashboardData?.schedule.map((slot) => (
                    <div key={slot.timetableid} className={localStyles.scheduleItem}>
                      <div style={{ flexGrow: 1 }}>
                        <Text weight="bold" size={300} block>{slot.courseName}</Text>
                        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }} block>
                          {slot.dayofweek} • {slot.starttime} - {slot.endtime}
                        </Text>
                        {slot.room && (
                          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                            Room: {slot.room}
                          </Text>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>



          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
