'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { StudentAPI } from '@/utils/api';
import { useStudent } from '../../StudentContext';
import { useStudentStyles } from '@/hooks/useStudentStyles';
import StudentPageState from '@/components/StudentPageState';
import { 
  makeStyles,
  tokens, 
  Text, 
  Title1, 
  Title3,
  Badge,
  Button,
  TabList,
  Tab,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  MessageBar,
  MessageBarTitle,
  MessageBarBody,
  shorthands
} from '@fluentui/react-components';
import { 
  HomeRegular, 
  BookOpenRegular, 
  RewardRegular,
  CalendarCheckmarkRegular,
  ChevronDownRegular,
  ChevronUpRegular,
  DocumentPdfRegular,
  VideoRegular,
  ClipboardRegular,
  BookRegular,
  Speaker2Regular,
  MegaphoneRegular,
  ArrowLeftRegular,
  ArrowRightRegular
} from '@fluentui/react-icons';

interface CourseInfo {
  courseOfferingId: number;
  code: string;
  name: string;
  credits: number;
  semester: string;
  instructor: string;
  mode: string;
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: string;
  date: string | Date;
}

interface AttendanceRecord {
  id: number;
  date: string;
  topic: string;
  status: string;
}

interface WeekItem {
  type: 'lecture' | 'assignment' | 'quiz';
  id?: number;
  title: string;
  date?: string;
  dueDate?: string;
  status: string;
  sessionDate?: string | Date;
  startTime?: string | Date;
  endTime?: string | Date;
  maxmarks?: number;
  marksawarded?: number | null;
  score?: number | null;
  totalmarks?: number;
}

interface WeekInfo {
  weekNumber: number;
  dateRange: string;
  items: WeekItem[];
}

interface GradeItem {
  id: number;
  name: string;
  grade: string;
  range: string;
  feedback: string;
}

interface CourseDetails {
  course: CourseInfo;
  announcements: Announcement[];
  attendance: AttendanceRecord[];
  weeks: WeekInfo[];
  grades: {
    assignments: GradeItem[];
    quizzes: GradeItem[];
    courseTotal: {
      grade: string;
      percentage: string;
    };
  };
}

const useLocalStyles = makeStyles({
  tabContainer: {
    marginTop: '12px',
    marginBottom: '24px'
  },
  headerStats: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    marginTop: '12px'
  },
  kpiRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  weekCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    marginBottom: '16px',
    overflow: 'hidden',
    boxShadow: tokens.shadow2
  },
  weekHeader: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    backgroundColor: tokens.colorNeutralBackground1,
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background-color 150ms',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover
    }
  },
  weekInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexGrow: 1,
    minWidth: 0
  },
  weekNumberBadge: {
    width: '36px',
    height: '36px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: tokens.fontWeightBold,
    flexShrink: 0
  },
  weekContent: {
    padding: '0 24px 24px 24px',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    transition: 'all 200ms',
    ':hover': {
      ...shorthands.borderColor(tokens.colorBrandStroke1),
      boxShadow: tokens.shadow2
    }
  },
  itemMain: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexGrow: 1,
    minWidth: 0
  },
  itemIcon: {
    fontSize: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: tokens.colorBrandForeground1
  },
  announcementCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    padding: '24px',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow2,
    display: 'flex',
    gap: '16px',
    marginBottom: '16px'
  },
  announcementIcon: {
    padding: '12px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    fontSize: '24px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  gradesContainer: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow2,
    overflowX: 'auto'
  },
  gradesSectionHeader: {
    padding: '16px 24px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  textbookGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px'
  },
  textbookCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    padding: '20px',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow2,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  }
});

export default function CourseContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = params?.courseId as string;
  const courseOfferingId = parseInt(courseId);

  const { profile, notifications, loading: layoutLoading, error: layoutError } = useStudent();
  const styles = useStudentStyles();
  const localStyles = useLocalStyles();

  const [details, setDetails] = useState<CourseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([1, 2]);
  const [activeTab, setActiveTab] = useState<'overview' | 'announcements' | 'attendance' | 'grades'>((searchParams.get('tab') as 'overview' | 'announcements' | 'attendance' | 'grades') || 'overview');

  useEffect(() => {
    if (isNaN(courseOfferingId)) {
      setError('Invalid course offering reference');
      setLoading(false);
      return;
    }
    
    if (!profile) return;
    
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const data = await StudentAPI.getCourseDetail(courseOfferingId) as CourseDetails;
        setDetails(data);
        
        // Auto expand weeks with items
        if (data.weeks) {
          const wNums = data.weeks.map((w: WeekInfo) => w.weekNumber);
          setExpandedWeeks(wNums.slice(0, 3));
        }
      } catch (err: unknown) {
        console.error('Error fetching course details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load course details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [profile, courseOfferingId]);

  if (layoutLoading || loading) {
    return <StudentPageState loading={true} error={null} currentPath={`/dashboard/student/courses/${courseId}`}>{null}</StudentPageState>;
  }

  if (layoutError || error || !details) {
    return <StudentPageState loading={false} error={layoutError || error || 'Failed to load course detail.'} currentPath={`/dashboard/student/courses/${courseId}`}>{null}</StudentPageState>;
  }

  const { course, announcements, attendance, weeks, grades } = details;
  const userName = profile?.personalRecord ? `${profile.personalRecord.firstname} ${profile.personalRecord.lastname}` : (profile?.student?.fullname || 'Student');
  
  const mappedNotifications = (notifications || []).map(n => ({
    id: n.notificationid.toString(),
    title: n.title,
    message: n.message,
    timestamp: new Date(n.createdat),
    read: n.isread,
    type: 'info' as const
  }));

  const toggleWeek = (weekNumber: number) => {
    setExpandedWeeks(prev =>
      prev.includes(weekNumber) ? prev.filter(w => w !== weekNumber) : [...prev, weekNumber]
    );
  };

  const getWeekItemIcon = (type: string) => {
    switch (type) {
      case 'lecture': return <VideoRegular className={localStyles.itemIcon} />;
      case 'assignment': return <ClipboardRegular className={localStyles.itemIcon} />;
      case 'quiz': return <RewardRegular className={localStyles.itemIcon} />;
      default: return <DocumentPdfRegular className={localStyles.itemIcon} />;
    }
  };

  const getAttendanceStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PRESENT': return <Badge appearance="filled" color="success">Present</Badge>;
      case 'ABSENT': return <Badge appearance="filled" color="danger">Absent</Badge>;
      case 'LATE': return <Badge appearance="filled" color="warning">Late</Badge>;
      default: return <Badge appearance="outline">{status}</Badge>;
    }
  };



  return (
    <DashboardLayout
      userRole={UserRole.STUDENT}
      userName={userName}
      notifications={mappedNotifications}
      currentPath={`/dashboard/student/courses`}
    >
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/dashboard/student" className={styles.breadcrumbLink}>
            <HomeRegular style={{ marginRight: '4px' }} /> Home
          </Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          <Link href="/dashboard/student/courses" className={styles.breadcrumbLink}>
            Courses
          </Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          <span className={styles.breadcrumbActive}>{course.name}</span>
        </nav>

        {/* Back Link */}
        <div>
          <Link href="/dashboard/student/courses" style={{ textDecoration: 'none' }}>
            <Button icon={<ArrowLeftRegular />}>Back to Courses</Button>
          </Link>
        </div>

        {/* Header Banner */}
        <div style={{
          backgroundColor: tokens.colorNeutralBackground1,
          border: `1px solid ${tokens.colorNeutralStroke1}`,
          borderRadius: tokens.borderRadiusMedium,
          padding: '24px',
          boxShadow: tokens.shadow2,
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '4px',
            backgroundImage: `linear-gradient(to right, ${tokens.colorBrandBackground}, ${tokens.colorBrandBackgroundHover})`
          }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                <Badge appearance="outline" color="brand">{course.code}</Badge>
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                  Instructor: <Text weight="semibold">{course.instructor}</Text>
                </Text>
              </div>
              <Title1 block style={{ margin: '0' }}>{course.name}</Title1>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Badge appearance="filled" color="brand">{course.semester}</Badge>
              <Badge appearance="filled" color="success">{course.mode}</Badge>
              <Badge appearance="outline">{course.credits} Credits</Badge>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <TabList 
          selectedValue={activeTab} 
          onTabSelect={(_, data) => {
            setActiveTab(data.value as 'overview' | 'announcements' | 'attendance' | 'grades');
            router.replace(`/dashboard/student/courses/${courseOfferingId}?tab=${data.value}`);
          }}
          className={localStyles.tabContainer}
        >
          <Tab value="overview" icon={<BookOpenRegular />}>Syllabus & Materials</Tab>
          <Tab value="announcements" icon={<MegaphoneRegular />}>Announcements</Tab>
          <Tab value="attendance" icon={<CalendarCheckmarkRegular />}>Attendance Log</Tab>
          <Tab value="grades" icon={<RewardRegular />}>Grade Summary</Tab>
        </TabList>

        {/* Tab Contents */}
        <div>
          {/* 1. Overview / Syllabus */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {weeks.map((week: WeekInfo) => (
                <div key={week.weekNumber} className={localStyles.weekCard}>
                  <button 
                    onClick={() => toggleWeek(week.weekNumber)} 
                    className={localStyles.weekHeader}
                  >
                    <div className={localStyles.weekInfo}>
                      <div className={localStyles.weekNumberBadge}>{week.weekNumber}</div>
                      <div>
                        <Text weight="bold" block>Week {week.weekNumber}</Text>
                        <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>{week.dateRange}</Text>
                      </div>
                    </div>
                    {expandedWeeks.includes(week.weekNumber) ? <ChevronUpRegular /> : <ChevronDownRegular />}
                  </button>

                  {expandedWeeks.includes(week.weekNumber) && (
                    <div className={localStyles.weekContent}>
                      {week.items.length === 0 ? (
                        <Text style={{ color: tokens.colorNeutralForeground3, textAlign: 'center', padding: '16px' }} block>
                          No scheduled lectures or activities for this week.
                        </Text>
                      ) : (
                        week.items.map((item: WeekItem, idx: number) => (
                          <div key={idx} className={localStyles.itemRow}>
                            <div className={localStyles.itemMain}>
                              {getWeekItemIcon(item.type)}
                              <div style={{ minWidth: 0 }}>
                                <Text weight="semibold" block truncate>{item.title}</Text>
                                <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                                  {item.type === 'lecture' && `Lecture Session • ${item.date}`}
                                  {item.type === 'assignment' && `Assignment • Due: ${item.dueDate} (${item.maxmarks} pts)`}
                                  {item.type === 'quiz' && `Quiz • Due: ${item.dueDate} (${item.totalmarks} pts)`}
                                </Text>
                              </div>
                            </div>
                            <div>
                              {item.type === 'lecture' && (
                                <Badge color={item.status === 'present' ? 'success' : (item.status === 'absent' ? 'danger' : 'warning')}>
                                  {item.status.toUpperCase()}
                                </Badge>
                              )}

                              {item.type === 'assignment' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  {item.status === 'submitted' ? (
                                    <Badge color="success">
                                      {item.marksawarded !== null ? `Graded: ${item.marksawarded}/${item.maxmarks}` : 'Submitted'}
                                    </Badge>
                                  ) : (
                                    <Badge appearance="outline">Pending</Badge>
                                  )}
                                  <Link href={`/dashboard/student/assignments/${item.id}`}>
                                    <Button size="small" appearance="subtle" icon={<ArrowRightRegular />} />
                                  </Link>
                                </div>
                              )}

                              {item.type === 'quiz' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  {item.status === 'completed' ? (
                                    <Badge color="success">
                                      {item.score !== null ? `Score: ${item.score}/${item.totalmarks}` : 'Completed'}
                                    </Badge>
                                  ) : (
                                    <Badge appearance="outline">Pending</Badge>
                                  )}
                                  <Link href={`/dashboard/student/quizzes/${item.id}`}>
                                    <Button size="small" appearance="subtle" icon={<ArrowRightRegular />} />
                                  </Link>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 2. Announcements */}
          {activeTab === 'announcements' && (
            <div>
              {announcements.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', border: `1px dashed ${tokens.colorNeutralStroke1}`, borderRadius: tokens.borderRadiusMedium, backgroundColor: tokens.colorNeutralBackground2 }}>
                  <Text style={{ color: tokens.colorNeutralForeground3 }} block>No announcements have been posted for this course yet.</Text>
                </div>
              ) : (
                announcements.map((a: Announcement) => (
                  <div key={a.id} className={localStyles.announcementCard}>
                    <div className={localStyles.announcementIcon}>
                      <Speaker2Regular />
                    </div>
                    <div>
                      <Text weight="bold" size={400} block style={{ marginBottom: '4px' }}>
                        {a.title}
                      </Text>
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginBottom: '12px' }} block>
                        Posted on {new Date(a.date).toLocaleDateString('en-US', { dateStyle: 'long' })}
                      </Text>
                      <Text style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                        {a.content}
                      </Text>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 3. Attendance Log */}
          {activeTab === 'attendance' && (
            <div className={localStyles.gradesContainer}>
              <div className={localStyles.gradesSectionHeader}>
                <Title3 style={{ margin: '0' }}>Attendance Sessions Log</Title3>
                <Badge color="brand">Term Progress</Badge>
              </div>
              {attendance.length === 0 ? (
                <Text style={{ textAlign: 'center', padding: '32px', color: tokens.colorNeutralForeground3 }} block>
                  No attendance records exist for this course yet.
                </Text>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell style={{ width: '25%' }}>Date</TableHeaderCell>
                      <TableHeaderCell style={{ width: '50%' }}>Lecture Topic</TableHeaderCell>
                      <TableHeaderCell style={{ width: '25%', textAlign: 'center' }}>Status</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.map((att: AttendanceRecord) => (
                      <TableRow key={att.id}>
                        <TableCell>
                          <Text weight="semibold">{att.date}</Text>
                        </TableCell>
                        <TableCell>
                          <Text>{att.topic}</Text>
                        </TableCell>
                        <TableCell style={{ textAlign: 'center' }}>
                          {getAttendanceStatusBadge(att.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}

          {/* 4. Grades Summary */}
          {activeTab === 'grades' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Assignments Grades */}
              <div className={localStyles.gradesContainer}>
                <div className={localStyles.gradesSectionHeader}>
                  <Title3 style={{ margin: '0' }}>Assignments Marks</Title3>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Weight: 50%</Text>
                </div>
                {grades.assignments.length === 0 ? (
                  <Text style={{ textAlign: 'center', padding: '24px', color: tokens.colorNeutralForeground3 }} block>
                    No assignments graded yet.
                  </Text>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHeaderCell>Assignment Name</TableHeaderCell>
                        <TableHeaderCell style={{ width: '150px' }}>Grade / Marks</TableHeaderCell>
                        <TableHeaderCell style={{ width: '150px' }}>Range</TableHeaderCell>
                        <TableHeaderCell>Feedback</TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grades.assignments.map((item: GradeItem) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Text weight="semibold">{item.name}</Text>
                          </TableCell>
                          <TableCell>
                            <Text>{item.grade}</Text>
                          </TableCell>
                          <TableCell>
                            <Text>{item.range}</Text>
                          </TableCell>
                          <TableCell>
                            <Text italic>{item.feedback}</Text>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* Quizzes Grades */}
              <div className={localStyles.gradesContainer}>
                <div className={localStyles.gradesSectionHeader}>
                  <Title3 style={{ margin: '0' }}>Quizzes Marks</Title3>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Weight: 50%</Text>
                </div>
                {grades.quizzes.length === 0 ? (
                  <Text style={{ textAlign: 'center', padding: '24px', color: tokens.colorNeutralForeground3 }} block>
                    No quizzes graded yet.
                  </Text>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHeaderCell>Quiz Name</TableHeaderCell>
                        <TableHeaderCell style={{ width: '150px' }}>Grade / Marks</TableHeaderCell>
                        <TableHeaderCell style={{ width: '150px' }}>Range</TableHeaderCell>
                        <TableHeaderCell>Feedback</TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grades.quizzes.map((item: GradeItem) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Text weight="semibold">{item.name}</Text>
                          </TableCell>
                          <TableCell>
                            <Text>{item.grade}</Text>
                          </TableCell>
                          <TableCell>
                            <Text>{item.range}</Text>
                          </TableCell>
                          <TableCell>
                            <Text italic>{item.feedback}</Text>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* Overall Course Grade */}
              <MessageBar intent="success" style={{ padding: '16px' }}>
                <MessageBarTitle>Current Standing</MessageBarTitle>
                <MessageBarBody>
                  Your current cumulative grade in this course is <Text weight="bold">{grades.courseTotal.grade}</Text> ({grades.courseTotal.percentage || '—'} marks evaluated).
                </MessageBarBody>
              </MessageBar>
            </div>
          )}


        </div>
      </div>
    </DashboardLayout>
  );
}
