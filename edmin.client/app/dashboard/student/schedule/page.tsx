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
  Text, 
  Title1, 
  Title3,
  Subtitle1,
  Badge,
  TabList,
  Tab
} from '@fluentui/react-components';
import { 
  ClockRegular, 
  HomeRegular, 
  CalendarCheckmarkRegular,
  BookOpenRegular,
  BookmarkRegular,
  CalendarDayRegular
} from '@fluentui/react-icons';

const dayMap: Record<string, string> = {
  'MON': 'Monday',
  'TUE': 'Tuesday',
  'WED': 'Wednesday',
  'THU': 'Thursday',
  'FRI': 'Friday',
  'SAT': 'Saturday',
  'SUN': 'Sunday',
};

export default function SchedulePage() {
  const styles = useStudentStyles();
  const { profile, notifications } = useStudent();
  
  const [schedule, setSchedule] = useState<StudentTypes.ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const todayStr = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date().getDay()];
  const [selectedTab, setSelectedTab] = useState<string>(todayStr === 'SUN' || todayStr === 'SAT' ? 'MON' : todayStr);

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const scheduleData = await StudentAPI.getSchedule();
        const mappedSchedule = (scheduleData || []).map((s: any) => ({
          timetableid: s.timetableid,
          courseofferingid: s.courseofferingid,
          courseName: s.courseoffering?.course?.name || '',
          courseCode: s.courseoffering?.course?.code || '',
          dayofweek: s.dayofweek,
          starttime: s.starttime,
          endtime: s.endtime,
          room: s.room || null
        }));
        setSchedule(mappedSchedule);
      } catch (err: any) {
        setError(err?.message || 'Failed to load class schedule');
      } finally {
        setLoading(false);
      }
    };
    loadSchedule();
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

  const { dailyClasses, totalClassesWeek, uniqueCourses, todayClassesCount } = useMemo(() => {
    return {
      dailyClasses: schedule.filter(item => item.dayofweek === selectedTab),
      totalClassesWeek: schedule.length,
      uniqueCourses: new Set(schedule.map(item => item.courseofferingid)).size,
      todayClassesCount: schedule.filter(item => item.dayofweek === todayStr).length
    };
  }, [schedule, selectedTab, todayStr]);

  const formatTimeStr = (isoTime: string) => {
    return new Date(isoTime).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <StudentPageState loading={loading} error={error} currentPath="/dashboard/student/schedule" layoutWrapper={true}>
      <DashboardLayout
        userRole={UserRole.STUDENT}
        userName={userName}
        notifications={mappedNotifications}
        currentPath="/dashboard/student/schedule"
      >
        <div className={styles.container}>
          {/* Breadcrumb */}
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/dashboard/student" className={styles.breadcrumbLink}>
              <HomeRegular style={{ marginRight: '4px' }} /> Home
            </Link>
            <span className={styles.breadcrumbSeparator}>/</span>
            <span className={styles.breadcrumbActive}>Schedule</span>
          </nav>

          {/* Header Card */}
          <div className={styles.headerCard}>
            <div className={styles.headerStrip}></div>
            <Title1>Weekly Class Schedule</Title1>
            <Subtitle1 block style={{ color: tokens.colorNeutralForeground2, marginTop: '4px' }}>
              View your class locations, timetables, and lecture slots.
            </Subtitle1>
          </div>

          {/* KPI Strip */}
          <div className={styles.kpiContainer}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <Text className={styles.kpiTitle}>Weekly Lectures</Text>
                <CalendarCheckmarkRegular className={styles.kpiIcon} />
              </div>
              <div>
                <div className={styles.kpiValue}>{totalClassesWeek}</div>
                <Text className={styles.kpiSubtext}>Total sessions scheduled</Text>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <Text className={styles.kpiTitle}>Active Courses</Text>
                <BookOpenRegular style={{ color: tokens.colorBrandForeground1 }} className={styles.kpiIcon} />
              </div>
              <div>
                <div className={styles.kpiValue}>{uniqueCourses}</div>
                <Text className={styles.kpiSubtext}>Different lecture modules</Text>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <Text className={styles.kpiTitle}>Today&apos;s Lectures</Text>
                <CalendarDayRegular style={{ color: tokens.colorPaletteGreenForeground1 }} className={styles.kpiIcon} />
              </div>
              <div>
                <div className={styles.kpiValue}>{todayClassesCount}</div>
                <Text className={styles.kpiSubtext}>Classes scheduled for today</Text>
              </div>
            </div>
          </div>

          {/* Timetable schedule container */}
          <div style={{
            backgroundColor: tokens.colorNeutralBackground1,
            border: `1px solid ${tokens.colorNeutralStroke1}`,
            borderRadius: tokens.borderRadiusMedium,
            boxShadow: tokens.shadow2,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <Title3>Weekly Timetable</Title3>

            <TabList 
              style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke2}` }}
              selectedValue={selectedTab} 
              onTabSelect={(_, data) => setSelectedTab(data.value as string)}
            >
              <Tab value="MON">Mon</Tab>
              <Tab value="TUE">Tue</Tab>
              <Tab value="WED">Wed</Tab>
              <Tab value="THU">Thu</Tab>
              <Tab value="FRI">Fri</Tab>
              <Tab value="SAT">Sat</Tab>
              <Tab value="SUN">Sun</Tab>
            </TabList>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
              {dailyClasses.map((item) => (
                <div 
                  key={item.timetableid} 
                  style={{
                    backgroundColor: tokens.colorNeutralBackground2,
                    border: `1px solid ${tokens.colorNeutralStroke1}`,
                    borderRadius: tokens.borderRadiusMedium,
                    padding: '16px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px',
                    transitionProperty: 'all',
                    transitionDuration: '200ms',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <Text weight="bold" size={400}>{item.courseName}</Text>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Badge size="small" appearance="outline" color="brand">{item.courseCode}</Badge>
                      {item.room && <Badge size="small" appearance="filled">{item.room}</Badge>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: tokens.colorNeutralForeground2, fontSize: '13px' }}>
                    <ClockRegular />
                    <Text weight="semibold">
                      {formatTimeStr(item.starttime)} - {formatTimeStr(item.endtime)}
                    </Text>
                  </div>
                </div>
              ))}

              {dailyClasses.length === 0 && (
                <div className={styles.emptyState}>
                  <BookmarkRegular style={{ fontSize: '48px', color: tokens.colorNeutralStroke1 }} />
                  <div>
                    <Text weight="semibold" block>No Classes Scheduled</Text>
                    <Text size={200}>Enjoy your free day! There are no lectures scheduled on {dayMap[selectedTab] || selectedTab}.</Text>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </StudentPageState>
  );
}
