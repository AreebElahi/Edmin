'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import Link from 'next/link';
import { StudentAPI } from '@/utils/api';
import * as StudentTypes from '@/types/student';
import { useStudent } from '../StudentContext';
import { useStudentStyles } from '@/hooks/useStudentStyles';
import StudentPageState from '@/components/StudentPageState';
import { 
  tokens, 
  Text, 
  Title1, 
  Subtitle1,
  Badge,
  Button,
  Input
} from '@fluentui/react-components';
import { 
  HomeRegular, 
  DocumentFolderRegular, 
  ClockRegular,
  SearchRegular,
  CheckmarkCircleRegular,
  WarningRegular,
  ChevronRightRegular,
  RewardRegular
} from '@fluentui/react-icons';

type FilterType = 'all' | 'pending' | 'submitted' | 'graded' | 'overdue';

export default function AssignmentsDashboard() {
  const styles = useStudentStyles();
  const { profile, notifications } = useStudent();

  const [assignments, setAssignments] = useState<StudentTypes.StudentAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const assignmentsData = await StudentAPI.getAssignments();
        const mappedAssignments = (assignmentsData || []).map((a: any) => ({
          assignmentid: a.assignmentId,
          title: a.title,
          duedate: a.duedate,
          maxmarks: a.maxmarks,
          description: a.description || null,
          courseName: a.course?.name || '',
          courseCode: a.course?.code || '',
          submission: a.submission,
        }));
        setAssignments(mappedAssignments as any);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load assignments list');
      } finally {
        setLoading(false);
      }
    };
    loadAssignments();
  }, []);

  const userName = profile?.student?.fullname || 'Student';
  const mappedNotifications = (notifications || []).map((n) => ({
    id: n.notificationid.toString(),
    title: n.title,
    message: n.message,
    timestamp: new Date(n.createdat),
    read: n.isread,
    type: 'info' as const
  }));

  const getAssignmentStatus = useCallback((assignment: StudentTypes.StudentAssignment): FilterType => {
    const isSubmitted = !!assignment.submission;
    const isGraded = assignment.submission?.status === 'GRADED' || assignment.submission?.marksawarded !== null;
    const isOverdue = new Date(assignment.duedate) < new Date();

    if (isGraded) return 'graded';
    if (isSubmitted) return 'submitted';
    if (isOverdue) return 'overdue';
    return 'pending';
  }, []);

  const getStatusBadge = (status: FilterType) => {
    switch (status) {
      case 'graded':
        return <Badge color="success">Graded</Badge>;
      case 'submitted':
        return <Badge color="brand">Submitted</Badge>;
      case 'overdue':
        return <Badge color="danger">Overdue</Badge>;
      case 'pending':
      default:
        return <Badge color="warning">Pending</Badge>;
    }
  };

  const filteredAssignments = useMemo(() => {
    return assignments
      .map(a => ({ ...a, resolvedStatus: getAssignmentStatus(a) }))
      .filter(a => {
        const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              a.courseName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              a.courseCode.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = selectedFilter === 'all' || a.resolvedStatus === selectedFilter;
        return matchesSearch && matchesFilter;
      });
  }, [assignments, searchQuery, selectedFilter, getAssignmentStatus]);

  const stats = useMemo(() => {
    return {
      pending: assignments.filter(a => getAssignmentStatus(a) === 'pending').length,
      overdue: assignments.filter(a => getAssignmentStatus(a) === 'overdue').length,
      submitted: assignments.filter(a => getAssignmentStatus(a) === 'submitted' || getAssignmentStatus(a) === 'graded').length,
    };
  }, [assignments, getAssignmentStatus]);

  return (
    <StudentPageState loading={loading} error={error} currentPath="/dashboard/student/assignments" layoutWrapper={true}>
      <DashboardLayout
        userRole={UserRole.STUDENT}
        userName={userName}
        notifications={mappedNotifications}
        currentPath="/dashboard/student/assignments"
      >
        <div className={styles.container}>
          {/* Breadcrumb */}
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/dashboard/student" className={styles.breadcrumbLink}>
              <HomeRegular style={{ marginRight: '4px' }} /> Home
            </Link>
            <span className={styles.breadcrumbSeparator}>/</span>
            <span className={styles.breadcrumbActive}>Assignments</span>
          </nav>

          {/* Header Card */}
          <div className={styles.headerCard}>
            <div className={styles.headerStrip}></div>
            <Title1>My Assignments</Title1>
            <Subtitle1 block style={{ color: tokens.colorNeutralForeground2, marginTop: '4px' }}>
              Submit coursework and view grades/feedback.
            </Subtitle1>
          </div>

          {/* KPI Strip */}
          <div className={styles.kpiContainer}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <Text className={styles.kpiTitle}>Pending Tasks</Text>
                <ClockRegular className={styles.kpiIcon} />
              </div>
              <div>
                <div className={styles.kpiValue}>{stats.pending}</div>
                <Text className={styles.kpiSubtext}>Requires submission</Text>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <Text className={styles.kpiTitle}>Overdue</Text>
                <WarningRegular style={{ color: tokens.colorPaletteRedForeground1 }} className={styles.kpiIcon} />
              </div>
              <div>
                <div className={styles.kpiValue}>{stats.overdue}</div>
                <Text className={styles.kpiSubtext}>Past due date</Text>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <Text className={styles.kpiTitle}>Completed</Text>
                <CheckmarkCircleRegular style={{ color: tokens.colorPaletteGreenForeground1 }} className={styles.kpiIcon} />
              </div>
              <div>
                <div className={styles.kpiValue}>{stats.submitted}</div>
                <Text className={styles.kpiSubtext}>Submitted or Graded tasks</Text>
              </div>
            </div>
          </div>

          {/* Controls (Search + Filters) */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Input 
              contentBefore={<SearchRegular />}
              placeholder="Search assignments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flexGrow: 1, minWidth: '280px' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['all', 'pending', 'submitted', 'graded', 'overdue'] as FilterType[]).map((filter) => (
                <Button
                  key={filter}
                  appearance={selectedFilter === filter ? 'primary' : 'outline'}
                  onClick={() => setSelectedFilter(filter)}
                  size="small"
                  style={{ textTransform: 'capitalize' }}
                >
                  {filter}
                </Button>
              ))}
            </div>
          </div>

          {/* Assignments List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredAssignments.map((assignment) => (
              <Link 
                key={assignment.assignmentid} 
                href={`/dashboard/student/assignments/${assignment.assignmentid}`}
                style={{ textDecoration: 'none' }}
              >
                <div 
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '20px',
                    backgroundColor: tokens.colorNeutralBackground1,
                    border: `1px solid ${tokens.colorNeutralStroke1}`,
                    borderRadius: tokens.borderRadiusMedium,
                    boxShadow: tokens.shadow2,
                    cursor: 'pointer',
                    flexWrap: 'wrap',
                    gap: '16px',
                    transitionProperty: 'all',
                    transitionDuration: '200ms',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexGrow: 1, minWidth: '280px' }}>
                    <DocumentFolderRegular style={{
                      fontSize: '28px',
                      color: tokens.colorNeutralForeground3,
                      padding: '12px',
                      backgroundColor: tokens.colorNeutralBackground2,
                      borderRadius: tokens.borderRadiusMedium,
                    }} />
                    <div>
                      <Text weight="bold" size={400} block style={{ color: tokens.colorNeutralForeground1 }}>
                        {assignment.title}
                      </Text>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                        <Badge size="small" appearance="outline">{assignment.courseCode}</Badge>
                        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                          {assignment.courseName}
                        </Text>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: tokens.colorNeutralForeground2, fontSize: '13px' }}>
                      <ClockRegular />
                      <Text size={200}>
                        Due: {new Date(assignment.duedate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </div>

                    {assignment.submission?.marksawarded !== null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: tokens.colorPaletteGreenForeground1, fontSize: '13px' }}>
                        <RewardRegular />
                        <Text weight="semibold">
                          Score: {assignment.submission?.marksawarded}/{assignment.maxmarks}
                        </Text>
                      </div>
                    )}

                    <div>
                      {getStatusBadge(assignment.resolvedStatus)}
                    </div>

                    <ChevronRightRegular style={{ fontSize: '20px', color: tokens.colorNeutralStroke1 }} />
                  </div>
                </div>
              </Link>
            ))}

            {filteredAssignments.length === 0 && (
              <div className={styles.emptyState}>
                <DocumentFolderRegular style={{ fontSize: '48px', color: tokens.colorNeutralStroke1 }} />
                <div>
                  <Text weight="semibold" block>No Assignments Found</Text>
                  <Text size={200}>There are no assignments matching your search criteria.</Text>
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </StudentPageState>
  );
}
