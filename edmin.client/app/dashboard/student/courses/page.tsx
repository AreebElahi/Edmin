'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { StudentAPI } from '@/utils/api';
import { useStudent } from '../StudentContext';
import { useStudentStyles } from '@/hooks/useStudentStyles';
import StudentPageState from '@/components/StudentPageState';
import { 
  makeStyles,
  tokens, 
  Text, 
  Title1, 
  Title3,
  Subtitle1,
  Badge,
  Button,
  ProgressBar,
  Menu,
  MenuTrigger,
  MenuList,
  MenuItem,
  MenuPopover,
  shorthands
} from '@fluentui/react-components';
import { 
  HomeRegular, 
  BookOpenRegular, 
  ClockRegular,
  ArrowRightRegular,
  FilterRegular,
  CheckmarkCircleRegular
} from '@fluentui/react-icons';

interface BaseCourse {
  courseEnrollmentId: number;
  courseOfferingId: number;
  courseId: number;
  code: string;
  name: string;
  credits: number;
  semester: string;
  instructor: string;
  status: string;
  grade: string;
  gradepoints: number | null;
  percentage: number | null;
  mode: string;
}

interface EnrolledCourse extends BaseCourse {
  attendance: number;
}

const useLocalStyles = makeStyles({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
    marginTop: '16px'
  },
  card: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '220px',
    boxShadow: tokens.shadow2,
    transitionProperty: 'all',
    transitionDuration: '200ms',
    cursor: 'pointer',
    ':hover': {
      boxShadow: tokens.shadow4,
      ...shorthands.borderColor(tokens.colorBrandStroke1),
    }
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '16px'
  },
  iconWrapper: {
    padding: '10px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  progressSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginVertical: '12px'
  },
  progressRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px'
  },
  cardFooter: {
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    paddingTop: '16px',
    marginTop: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: tokens.colorNeutralForeground3
  }
});

export default function CoursesDashboard() {
  const { profile, notifications, loading: layoutLoading, error: layoutError } = useStudent();
  const styles = useStudentStyles();
  const localStyles = useLocalStyles();
  
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'name' | 'code'>('name');

  useEffect(() => {
    if (!profile) return;
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const [data, attendanceData] = await Promise.all([
          StudentAPI.getCourses(),
          StudentAPI.getAttendanceSummary()
        ]);
        
        const enriched: EnrolledCourse[] = data.map((c: BaseCourse) => {
          const courseAttendance = attendanceData.find(a => a.courseOfferingId === c.courseOfferingId);
          return {
            ...c,
            attendance: courseAttendance ? Math.round(courseAttendance.percentage) : 0
          };
        });
        setCourses(enriched);
      } catch (err: unknown) {
        console.error('Error loading enrolled courses:', err);
        setError(err instanceof Error ? err.message : 'Failed to load courses.');
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [profile]);

  if (layoutLoading || loading) {
    return <StudentPageState loading={true} error={null} currentPath="/dashboard/student/courses">{null}</StudentPageState>;
  }

  if (layoutError || error) {
    return <StudentPageState loading={false} error={layoutError || error || 'Failed to load courses.'} currentPath="/dashboard/student/courses">{null}</StudentPageState>;
  }

  const userName = profile?.personalRecord ? `${profile.personalRecord.firstname} ${profile.personalRecord.lastname}` : (profile?.student?.fullname || 'Student');
  
  const mappedNotifications = (notifications || []).map(n => ({
    id: n.notificationid.toString(),
    title: n.title,
    message: n.message,
    timestamp: new Date(n.createdat),
    read: n.isread,
    type: 'info' as const
  }));

  const sortedCourses = [...courses].sort((a, b) => {
    if (filterType === 'name') {
      return a.name.localeCompare(b.name);
    } else {
      return a.code.localeCompare(b.code);
    }
  });

  return (
    <DashboardLayout
      userRole={UserRole.STUDENT}
      userName={userName}
      notifications={mappedNotifications}
      currentPath="/dashboard/student/courses"
    >
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/dashboard/student" className={styles.breadcrumbLink}>
            <HomeRegular style={{ marginRight: '4px' }} /> Home
          </Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          <span className={styles.breadcrumbActive}>My Courses</span>
        </nav>

        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <Title1 block>My Courses</Title1>
            <Subtitle1 style={{ color: tokens.colorNeutralForeground3 }}>
              View and access all your enrolled courses for the current semester.
            </Subtitle1>
          </div>

          <div>
            <Menu>
              <MenuTrigger disableButtonEnhancement>
                <Button icon={<FilterRegular />}>
                  Sort: {filterType === 'name' ? 'Course Name' : 'Course Code'}
                </Button>
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  <MenuItem 
                    icon={filterType === 'name' ? <CheckmarkCircleRegular /> : undefined}
                    onClick={() => setFilterType('name')}
                  >
                    Course Name
                  </MenuItem>
                  <MenuItem 
                    icon={filterType === 'code' ? <CheckmarkCircleRegular /> : undefined}
                    onClick={() => setFilterType('code')}
                  >
                    Course Code
                  </MenuItem>
                </MenuList>
              </MenuPopover>
            </Menu>
          </div>
        </div>

        {/* Course Grid */}
        {sortedCourses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', border: `1px dashed ${tokens.colorNeutralStroke1}`, borderRadius: tokens.borderRadiusMedium, backgroundColor: tokens.colorNeutralBackground2 }}>
            <Text style={{ color: tokens.colorNeutralForeground3 }} block size={400}>You are not enrolled in any courses this semester.</Text>
          </div>
        ) : (
          <div className={localStyles.grid}>
            {sortedCourses.map((c) => (
              <Link 
                key={c.courseOfferingId} 
                href={`/dashboard/student/courses/${c.courseOfferingId}`}
                style={{ textDecoration: 'none' }}
              >
                <div className={localStyles.card}>
                  <div>
                    <div className={localStyles.cardHeader}>
                      <div style={{ minWidth: 0, flexGrow: 1 }}>
                        <Badge appearance="outline" color="brand" style={{ marginBottom: '8px' }}>
                          {c.code}
                        </Badge>
                        <Title3 block style={{ margin: '0' }} truncate>
                          {c.name}
                        </Title3>
                        <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginTop: '4px' }} block>
                          Instructor: {c.instructor}
                        </Text>
                      </div>
                      <div className={localStyles.iconWrapper}>
                        <BookOpenRegular style={{ fontSize: '24px' }} />
                      </div>
                    </div>

                    <div className={localStyles.progressSection}>
                      <div>
                        <div className={localStyles.progressRow}>
                          <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>Attendance</Text>
                          <Text size={100} weight="semibold">{c.attendance}%</Text>
                        </div>
                        <ProgressBar value={c.attendance / 100} color="success" />
                      </div>
                    </div>
                  </div>

                  <div className={localStyles.cardFooter}>
                    <Button 
                      size="small" 
                      appearance="subtle" 
                      icon={<ArrowRightRegular />} 
                      iconPosition="after"
                    >
                      Enter
                    </Button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
