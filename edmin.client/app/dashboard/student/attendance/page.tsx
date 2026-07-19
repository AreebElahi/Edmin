'use client';

import { useState, useEffect, useMemo } from 'react';
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
  ProgressBar,
  Badge,
  Button
} from '@fluentui/react-components';
import { 
  CalendarCheckmarkRegular, 
  ChevronRightRegular, 
  HomeRegular, 
  CheckmarkCircleRegular,
  DismissCircleRegular
} from '@fluentui/react-icons';

export default function AttendancePage() {
  const styles = useStudentStyles();
  const { profile, notifications } = useStudent();
  
  const [courses, setCourses] = useState<StudentTypes.AttendanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAttendance = async () => {
      try {
        const attendanceData = await StudentAPI.getAttendanceSummary();
        const mappedAttendance = (attendanceData || []).map((a: any) => ({
          attendancesummaryid: a.attendancesummaryid,
          courseOfferingId: a.courseOfferingId || a.courseofferingid,
          courseName: a.course?.name || '',
          courseCode: a.course?.code || '',
          totalpresent: a.totalpresent || a.totalPresent || 0,
          totalabsent: a.totalabsent || a.totalAbsent || 0,
          totalclasses: a.totalclasses || a.totalClasses || 0,
          percentage: a.percentage || 0
        }));
        setCourses(mappedAttendance);
      } catch (err: any) {
        setError(err?.message || 'Failed to load attendance data');
      } finally {
        setLoading(false);
      }
    };
    loadAttendance();
  }, []);

  const { totalClasses, totalPresent, totalAbsent, averageAttendance } = useMemo(() => {
    const classes = courses.reduce((sum, c) => sum + (c.totalclasses || 0), 0);
    const present = courses.reduce((sum, c) => sum + (c.totalpresent || 0), 0);
    const absent = courses.reduce((sum, c) => sum + (c.totalabsent || 0), 0);
    const average = classes > 0 
      ? Number(((present / classes) * 100).toFixed(1)) 
      : 0;
    
    return {
      totalClasses: classes,
      totalPresent: present,
      totalAbsent: absent,
      averageAttendance: average
    };
  }, [courses]);

  const userName = profile?.student?.fullname || 'Student';
  const mappedNotifications = (notifications || []).map((n) => ({
    id: n.notificationid.toString(),
    title: n.title,
    message: n.message,
    timestamp: new Date(n.createdat),
    read: n.isread,
    type: 'info' as const
  }));

  return (
    <StudentPageState loading={loading} error={error} currentPath="/dashboard/student/attendance" layoutWrapper={true}>
      <DashboardLayout
        userRole={UserRole.STUDENT}
        userName={userName}
        notifications={mappedNotifications}
        currentPath="/dashboard/student/attendance"
      >
        <div className={styles.container}>
          {/* Breadcrumb */}
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/dashboard/student" className={styles.breadcrumbLink}>
              <HomeRegular style={{ marginRight: '4px' }} /> Home
            </Link>
            <span className={styles.breadcrumbSeparator}>/</span>
            <span className={styles.breadcrumbActive}>Attendance</span>
          </nav>

          {/* Header Card */}
          <div className={styles.headerCard}>
            <div className={styles.headerStrip}></div>
            <Title1>Attendance Report</Title1>
            <Subtitle1 block style={{ color: tokens.colorNeutralForeground2, marginTop: '4px' }}>
              Track and monitor your class participation rates across all registered courses.
            </Subtitle1>
          </div>

          {/* KPI Strip */}
          <div className={styles.kpiContainer}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <Text className={styles.kpiTitle}>Overall Attendance</Text>
                <CalendarCheckmarkRegular className={styles.kpiIcon} />
              </div>
              <div>
                <div className={styles.kpiValue}>{averageAttendance}%</div>
                <ProgressBar 
                  value={averageAttendance / 100} 
                  color={averageAttendance >= 75 ? 'success' : averageAttendance >= 60 ? 'warning' : 'error'} 
                />
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <Text className={styles.kpiTitle}>Total Sessions</Text>
                <CheckmarkCircleRegular style={{ color: tokens.colorPaletteGreenForeground1 }} className={styles.kpiIcon} />
              </div>
              <div>
                <div className={styles.kpiValue}>{totalClasses}</div>
                <Text className={styles.kpiSubtext}>Scheduled lectures this term</Text>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <Text className={styles.kpiTitle}>Absences</Text>
                <DismissCircleRegular style={{ color: tokens.colorPaletteRedForeground1 }} className={styles.kpiIcon} />
              </div>
              <div>
                <div className={styles.kpiValue}>{totalAbsent}</div>
                <Text className={styles.kpiSubtext}>Missed class sessions</Text>
              </div>
            </div>
          </div>

          {/* Main Content */}
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
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Title3>Registered Course Attendance</Title3>
              <Badge appearance="outline" color="brand">Active Term</Badge>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell style={{ width: '40%' }}>Course</TableHeaderCell>
                  <TableHeaderCell style={{ textAlign: 'center' }}>Present</TableHeaderCell>
                  <TableHeaderCell style={{ textAlign: 'center' }}>Absent</TableHeaderCell>
                  <TableHeaderCell style={{ textAlign: 'center' }}>Total Classes</TableHeaderCell>
                  <TableHeaderCell style={{ width: '30%', textAlign: 'center' }}>Percentage Rate</TableHeaderCell>
                  <TableHeaderCell />
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.attendancesummaryid}>
                    <TableCell>
                      <Text weight="semibold" block>{course.courseName}</Text>
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{course.courseCode}</Text>
                    </TableCell>
                    <TableCell style={{ textAlign: 'center' }}>
                      <Text weight="semibold">{course.totalpresent}</Text>
                    </TableCell>
                    <TableCell style={{ textAlign: 'center' }}>
                      <Text style={{ color: course.totalabsent > 0 ? tokens.colorPaletteRedForeground1 : 'inherit' }}>
                        {course.totalabsent}
                      </Text>
                    </TableCell>
                    <TableCell style={{ textAlign: 'center' }}>
                      <Text>{course.totalclasses}</Text>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
                        <ProgressBar 
                          value={course.percentage / 100} 
                          color={course.percentage >= 75 ? 'success' : course.percentage >= 60 ? 'warning' : 'error'}
                          style={{ width: '120px' }}
                        />
                        <Text 
                          style={{ 
                            fontWeight: tokens.fontWeightBold, 
                            width: '48px', 
                            textAlign: 'right',
                            color: course.percentage >= 75 ? tokens.colorPaletteGreenForeground1 : course.percentage >= 60 ? tokens.colorPaletteYellowForeground1 : tokens.colorPaletteRedForeground1 
                          }}
                        >
                          {course.percentage.toFixed(1)}%
                        </Text>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/student/attendance/${course.courseOfferingId}`}>
                        <Button size="small" icon={<ChevronRightRegular />} appearance="subtle" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DashboardLayout>
    </StudentPageState>
  );
}
