'use client';

import { useState, useEffect, use } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import Link from 'next/link';
import { StudentAPI } from '@/utils/api';
import * as StudentTypes from '@/types/student';
import { useStudent } from '../../StudentContext';
import { useStudentStyles } from '@/hooks/useStudentStyles';
import StudentPageState from '@/components/StudentPageState';
import { 
  tokens, 
  Table, 
  TableHeader, 
  TableRow, 
  TableHeaderCell, 
  TableBody, 
  TableCell, 
  Text, 
  Title1, 
  Title3,
  Subtitle1,
  Badge,
  Button
} from '@fluentui/react-components';
import { 
  CalendarRegular, 
  ClockRegular, 
  HomeRegular, 
  ArrowLeftRegular
} from '@fluentui/react-icons';

export default function CourseAttendancePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const styles = useStudentStyles();
  const { profile, notifications } = useStudent();

  const [records, setRecords] = useState<StudentTypes.AttendanceSessionLog[]>([]);
  const [summary, setSummary] = useState<StudentTypes.AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const offeringId = parseInt(courseId);
        const [sessionLogs, attendanceSummaries] = await Promise.all([
          StudentAPI.getAttendanceDetail(offeringId),
          StudentAPI.getAttendanceSummary(),
        ]);

        setRecords(sessionLogs || []);
        
        const courseSummary = (attendanceSummaries || []).find(s => s.courseOfferingId === offeringId);
        if (courseSummary) {
          setSummary(courseSummary);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load detailed attendance records');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [courseId]);

  const userName = profile?.student?.fullname || 'Student';
  const mappedNotifications = (notifications || []).map((n) => ({
    id: n.notificationid.toString(),
    title: n.title,
    message: n.message,
    timestamp: new Date(n.createdat),
    read: n.isread,
    type: 'info' as const
  }));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <Badge color="success">Present</Badge>;
      case 'ABSENT':
        return <Badge color="danger">Absent</Badge>;
      case 'LATE':
        return <Badge color="warning">Late</Badge>;
      case 'EXCUSED':
        return <Badge color="informative">Excused</Badge>;
      default:
        return <Badge color="subtle">{status}</Badge>;
    }
  };

  return (
    <StudentPageState loading={loading} error={error} currentPath={`/dashboard/student/attendance/${courseId}`} layoutWrapper={true}>
      <DashboardLayout
        userRole={UserRole.STUDENT}
        userName={userName}
        notifications={mappedNotifications}
        currentPath={`/dashboard/student/attendance/${courseId}`}
      >
        <div className={styles.container}>
          {/* Breadcrumb */}
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/dashboard/student" className={styles.breadcrumbLink}>
              <HomeRegular style={{ marginRight: '4px' }} /> Home
            </Link>
            <span className={styles.breadcrumbSeparator}>/</span>
            <Link href="/dashboard/student/attendance" className={styles.breadcrumbLink}>
              Attendance
            </Link>
            <span className={styles.breadcrumbSeparator}>/</span>
            <span className={styles.breadcrumbActive}>Details</span>
          </nav>

          {/* Back Link */}
          <div>
            <Link href="/dashboard/student/attendance" style={{ textDecoration: 'none' }}>
              <Button icon={<ArrowLeftRegular />}>Back to Attendance Summaries</Button>
            </Link>
          </div>

          {/* Header Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Title1>{summary?.courseName || 'Course Detail'}</Title1>
            <Subtitle1 block style={{ color: tokens.colorNeutralForeground2 }}>
              {summary?.courseCode || ''} • Session logs and timelines
            </Subtitle1>
          </div>

          {/* Stats Cards */}
          {summary && (
            <div className={styles.kpiContainer}>
              <div className={styles.kpiCard}>
                <Text className={styles.kpiTitle}>Total Lectures</Text>
                <div className={styles.kpiValue}>{summary.totalclasses}</div>
              </div>
              <div className={styles.kpiCard}>
                <Text className={styles.kpiTitle}>Attended</Text>
                <div className={styles.kpiValue} style={{ color: tokens.colorPaletteGreenForeground1 }}>
                  {summary.totalpresent}
                </div>
              </div>
              <div className={styles.kpiCard}>
                <Text className={styles.kpiTitle}>Absences</Text>
                <div className={styles.kpiValue} style={{ color: tokens.colorPaletteRedForeground1 }}>
                  {summary.totalabsent}
                </div>
              </div>
              <div className={styles.kpiCard}>
                <Text className={styles.kpiTitle}>Attendance Rate</Text>
                <div className={styles.kpiValue} style={{ color: tokens.colorBrandForeground1 }}>
                  {summary.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          )}

          {/* Sessions Table */}
          <div style={{
            backgroundColor: tokens.colorNeutralBackground1,
            border: `1px solid ${tokens.colorNeutralStroke1}`,
            borderRadius: tokens.borderRadiusMedium,
            boxShadow: tokens.shadow2,
            overflowX: 'auto'
          }}>
            <div style={{
              padding: '16px 24px',
              borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
              backgroundColor: tokens.colorNeutralBackground3,
            }}>
              <Title3>Session History Log</Title3>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell style={{ width: '25%' }}>Date</TableHeaderCell>
                  <TableHeaderCell style={{ width: '20%' }}>Time Slot</TableHeaderCell>
                  <TableHeaderCell style={{ width: '35%' }}>Topic Covered</TableHeaderCell>
                  <TableHeaderCell style={{ width: '20%', textAlign: 'center' }}>Participation Status</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.attendanceid}>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CalendarRegular style={{ color: tokens.colorNeutralForeground3, fontSize: '16px' }} />
                        <Text weight="semibold">
                          {new Date(record.sessiondate).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </Text>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ClockRegular style={{ color: tokens.colorNeutralForeground3, fontSize: '16px' }} />
                        <Text size={200}>
                          {new Date(record.starttime).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          -{' '}
                          {new Date(record.endtime).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Text italic={!record.topic}>
                        {record.topic || 'No topic details logged.'}
                      </Text>
                    </TableCell>
                    <TableCell style={{ textAlign: 'center' }}>
                      {getStatusBadge(record.status)}
                    </TableCell>
                  </TableRow>
                ))}
                {records.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} style={{ textAlign: 'center', padding: '32px' }}>
                      <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
                        No detailed sessions found for this course offering.
                      </Text>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DashboardLayout>
    </StudentPageState>
  );
}
