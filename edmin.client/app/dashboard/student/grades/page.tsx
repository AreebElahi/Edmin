'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Badge,
  Button
} from '@fluentui/react-components';
import { 
  HatGraduationRegular, 
  ChevronRightRegular, 
  HomeRegular, 
  RewardRegular,
  CheckmarkCircleRegular,
  DocumentTextRegular
} from '@fluentui/react-icons';

export default function GradesPage() {
  const styles = useStudentStyles();
  const { profile, notifications } = useStudent();
  
  const [data, setData] = useState<StudentTypes.GradesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGrades = async () => {
      try {
        const gradesData = await StudentAPI.getGrades() as any;
        const mappedGrades = {
          gpa: gradesData.gpa,
          totalCredits: gradesData.totalCredits,
          enrollments: (gradesData.grades || []).map((g: any) => ({
            courseenrollmentid: g.enrollmentId,
            courseofferingid: g.courseOfferingId || g.enrollmentId,
            courseName: g.course?.name || '',
            courseCode: g.course?.code || '',
            credits: g.course?.credits || 0,
            status: g.status,
            grade: g.grade,
            gradepoints: g.gradepoints,
            percentage: g.percentage
          }))
        };
        setData(mappedGrades as any);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load grade report');
      } finally {
        setLoading(false);
      }
    };
    loadGrades();
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

  const getPercentageColor = useCallback((percentage: number | null) => {
    if (percentage === null) return tokens.colorNeutralForeground3;
    if (percentage >= 80) return tokens.colorPaletteGreenForeground1;
    if (percentage >= 70) return tokens.colorPaletteYellowForeground1;
    return tokens.colorPaletteRedForeground1;
  }, []);

  return (
    <StudentPageState loading={loading} error={error} currentPath="/dashboard/student/grades" layoutWrapper={true}>
      <DashboardLayout
        userRole={UserRole.STUDENT}
        userName={userName}
        notifications={mappedNotifications}
        currentPath="/dashboard/student/grades"
      >
        <div className={styles.container}>
          {/* Breadcrumb */}
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/dashboard/student" className={styles.breadcrumbLink}>
              <HomeRegular style={{ marginRight: '4px' }} /> Home
            </Link>
            <span className={styles.breadcrumbSeparator}>/</span>
            <span className={styles.breadcrumbActive}>Grades</span>
          </nav>

          {/* Header Card */}
          <div className={styles.headerCard}>
            <div className={styles.headerStrip}></div>
            <div>
              <Title1>Academic Transcript</Title1>
              <Subtitle1 block style={{ color: tokens.colorNeutralForeground2, marginTop: '4px' }}>
                Official record of your semester-wise academic grades.
              </Subtitle1>
            </div>
            <div>
              <Button icon={<DocumentTextRegular />} appearance="primary">
                Export Official PDF
              </Button>
            </div>
          </div>

          {/* KPI Strip */}
          <div className={styles.kpiContainer}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <Text className={styles.kpiTitle}>Cumulative GPA</Text>
                <HatGraduationRegular className={styles.kpiIcon} />
              </div>
              <div>
                <div className={styles.kpiValue}>{data?.cgpa?.toFixed(2) || '0.00'}</div>
                <Text className={styles.kpiSubtext}>Based on current system calculations</Text>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <Text className={styles.kpiTitle}>Credits Completed</Text>
                <CheckmarkCircleRegular style={{ color: tokens.colorPaletteGreenForeground1 }} className={styles.kpiIcon} />
              </div>
              <div>
                <div className={styles.kpiValue}>{data?.creditsCompleted || 0} CH</div>
                <Text className={styles.kpiSubtext}>Successfully graded courses</Text>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <Text className={styles.kpiTitle}>Credits Registered</Text>
                <RewardRegular style={{ color: tokens.colorBrandForeground1 }} className={styles.kpiIcon} />
              </div>
              <div>
                <div className={styles.kpiValue}>{data?.creditsRegistered || 0} CH</div>
                <Text className={styles.kpiSubtext}>Total credits this semester</Text>
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
              <Title3>Graded Course Enrollments</Title3>
              <Badge appearance="outline" color="brand">Current Semester</Badge>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell style={{ width: '45%' }}>Course</TableHeaderCell>
                  <TableHeaderCell style={{ textAlign: 'center' }}>Credit Hours</TableHeaderCell>
                  <TableHeaderCell style={{ textAlign: 'center' }}>Status</TableHeaderCell>
                  <TableHeaderCell style={{ textAlign: 'center' }}>Obtained Marks</TableHeaderCell>
                  <TableHeaderCell style={{ textAlign: 'center' }}>Letter Grade</TableHeaderCell>
                  <TableHeaderCell style={{ textAlign: 'center' }}>Grade Points</TableHeaderCell>
                  <TableHeaderCell />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.enrollments.map((item) => (
                  <TableRow key={item.courseenrollmentid}>
                    <TableCell>
                      <Link href={`/dashboard/student/courses/${item.courseofferingid}?tab=grades`} style={{ textDecoration: 'none' }}>
                        <Text weight="semibold" block style={{ color: tokens.colorNeutralForeground1, cursor: 'pointer' }}>
                          {item.courseName}
                        </Text>
                      </Link>
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{item.courseCode}</Text>
                    </TableCell>
                    <TableCell style={{ textAlign: 'center' }}>
                      <Text>{item.credits} CH</Text>
                    </TableCell>
                    <TableCell style={{ textAlign: 'center' }}>
                      <Badge color={item.status === 'ENROLLED' ? 'success' : 'subtle'}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ textAlign: 'center' }}>
                      <Text 
                        weight="semibold"
                        style={{ color: getPercentageColor(item.percentage) }}
                      >
                        {item.percentage !== null ? `${item.percentage.toFixed(1)}%` : '-'}
                      </Text>
                    </TableCell>
                    <TableCell style={{ textAlign: 'center' }}>
                      <Text weight="bold">{item.grade || '-'}</Text>
                    </TableCell>
                    <TableCell style={{ textAlign: 'center' }}>
                      <Text>{item.gradepoints !== null ? item.gradepoints.toFixed(2) : '-'}</Text>
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/student/courses/${item.courseofferingid}?tab=grades`}>
                        <Button size="small" icon={<ChevronRightRegular />} appearance="subtle" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {(!data || data.enrollments.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} style={{ textAlign: 'center', padding: '32px' }}>
                      <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
                        No grades or course registrations found.
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
