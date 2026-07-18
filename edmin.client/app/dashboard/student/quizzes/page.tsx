'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import Link from 'next/link';
import { StudentAPI } from '@/utils/api';
import { apiGet } from '@/api/apiContract';
import * as StudentTypes from '@/types/student';
import { useStudent } from '../StudentContext';
import { useStudentStyles } from '@/hooks/useStudentStyles';
import StudentPageState from '@/components/StudentPageState';
import { 
  makeStyles,
  tokens, 
  shorthands,
  Text, 
  Title1, 
  Subtitle1,
  Badge,
  Button,
  Input
} from '@fluentui/react-components';
import { 
  HomeRegular, 
  QuizNewRegular, 
  ClockRegular,
  SearchRegular,
  CheckmarkCircleRegular,
  ChevronRightRegular,
  RewardRegular
} from '@fluentui/react-icons';

type FilterType = 'all' | 'available' | 'completed';

const useLocalStyles = makeStyles({
  quizCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow2,
    cursor: 'pointer',
    flexWrap: 'wrap',
    gap: '16px',
    transitionProperty: 'all',
    transitionDuration: '200ms',
    ':hover': {
      boxShadow: tokens.shadow4,
      ...shorthands.borderColor(tokens.colorBrandStroke1),
    }
  },
  quizIcon: {
    fontSize: '28px',
    color: tokens.colorNeutralForeground3,
    padding: '12px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
  }
});

export default function QuizzesDashboard() {
  const styles = useStudentStyles();
  const localStyles = useLocalStyles();
  const { profile, notifications } = useStudent();

  const [quizzes, setQuizzes] = useState<StudentTypes.StudentQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');

  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        const quizzesData = await StudentAPI.getQuizzes();
        
        let aiQuizzesData = [];
        try {
          const aiRes = await apiGet('/ai-quiz/');
          aiQuizzesData = (aiRes as any)?.data || (aiRes as any) || [];
        } catch (e) {
          console.error("Failed to fetch exam quizzes", e);
        }

        const mappedNormal = (quizzesData || []).map((q: any) => ({
          quizid: q.quizId,
          title: q.title,
          duration: q.duration,
          totalmarks: q.totalmarks,
          description: q.description || null,
          courseName: q.course?.name || '',
          courseCode: q.course?.code || '',
          attempted: q.status === 'completed',
          score: q.attempt?.score ?? null,
          submittedat: q.attempt?.submittedAt ?? null,
          isExam: false
        }));

        const mappedExam = aiQuizzesData.map((q: any) => ({
          quizid: q.aiquizid,
          title: q.title,
          duration: q.timelimitminutes,
          totalmarks: q.questioncount,
          description: q.description || null,
          courseName: q.courseoffering?.course?.name || '',
          courseCode: q.courseoffering?.course?.code || '',
          attempted: q.attempts?.length > 0,
          score: q.attempts?.[0]?.score ?? null,
          submittedat: q.attempts?.[0]?.status === 'SUBMITTED' || q.attempts?.[0]?.status === 'AUTO_SUBMITTED' ? new Date().toISOString() : null,
          isExam: true
        }));

        setQuizzes([...mappedNormal, ...mappedExam] as any);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load quizzes');
      } finally {
        setLoading(false);
      }
    };
    loadQuizzes();
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

  const getQuizStatus = useCallback((quiz: StudentTypes.StudentQuiz): FilterType => {
    return quiz.attempted ? 'completed' : 'available';
  }, []);

  const getStatusBadge = (status: FilterType) => {
    switch (status) {
      case 'completed':
        return <Badge color="success">Completed</Badge>;
      case 'available':
      default:
        return <Badge color="brand">Available</Badge>;
    }
  };

  const filteredQuizzes = useMemo(() => {
    return quizzes
      .map(q => ({ ...q, resolvedStatus: getQuizStatus(q) }))
      .filter(q => {
        const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              q.courseName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              q.courseCode.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = selectedFilter === 'all' || q.resolvedStatus === selectedFilter;
        return matchesSearch && matchesFilter;
      });
  }, [quizzes, searchQuery, selectedFilter, getQuizStatus]);

  const stats = useMemo(() => {
    return {
      available: quizzes.filter(q => !q.attempted).length,
      completed: quizzes.filter(q => q.attempted).length,
    };
  }, [quizzes]);

  return (
    <StudentPageState loading={loading} error={error} currentPath="/dashboard/student/quizzes" layoutWrapper={true}>
      <DashboardLayout
        userRole={UserRole.STUDENT}
        userName={userName}
        notifications={mappedNotifications}
        currentPath="/dashboard/student/quizzes"
      >
        <div className={styles.container}>
          {/* Breadcrumb */}
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/dashboard/student" className={styles.breadcrumbLink}>
              <HomeRegular style={{ marginRight: '4px' }} /> Home
            </Link>
            <span className={styles.breadcrumbSeparator}>/</span>
            <span className={styles.breadcrumbActive}>Quizzes</span>
          </nav>

          {/* Header Card */}
          <div className={styles.headerCard}>
            <div className={styles.headerStrip}></div>
            <Title1>Assigned Quizzes</Title1>
            <Subtitle1 block style={{ color: tokens.colorNeutralForeground2, marginTop: '4px' }}>
              Take tests, check durations, and view quiz grading reports.
            </Subtitle1>
          </div>

          {/* KPI Strip */}
          <div className={styles.kpiContainer}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <Text className={styles.kpiTitle}>Available Tests</Text>
                <QuizNewRegular className={styles.kpiIcon} />
              </div>
              <div>
                <div className={styles.kpiValue}>{stats.available}</div>
                <Text className={styles.kpiSubtext}>Ready to attempt</Text>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <Text className={styles.kpiTitle}>Completed Tests</Text>
                <CheckmarkCircleRegular style={{ color: tokens.colorPaletteGreenForeground1 }} className={styles.kpiIcon} />
              </div>
              <div>
                <div className={styles.kpiValue}>{stats.completed}</div>
                <Text className={styles.kpiSubtext}>Attempted quizzes</Text>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Input 
              contentBefore={<SearchRegular />}
              placeholder="Search quizzes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flexGrow: 1, minWidth: '280px' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['all', 'available', 'completed'] as FilterType[]).map((filter) => (
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

          {/* Quizzes List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredQuizzes.map((quiz: any) => (
              <Link 
                key={`${quiz.isExam ? 'exam' : 'normal'}-${quiz.quizid}`} 
                href={quiz.isExam ? `/dashboard/student/quizzes/exam/${quiz.quizid}` : `/dashboard/student/quizzes/${quiz.quizid}`}
                style={{ textDecoration: 'none' }}
              >
                <div className={localStyles.quizCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexGrow: 1, minWidth: '280px' }}>
                    <QuizNewRegular className={localStyles.quizIcon} />
                    <div>
                      <Text weight="bold" size={400} block style={{ color: tokens.colorNeutralForeground1 }}>
                        {quiz.title}
                      </Text>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                        <Badge size="small" appearance="outline">{quiz.courseCode}</Badge>
                        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                          {quiz.courseName}
                        </Text>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: tokens.colorNeutralForeground2, fontSize: '13px' }}>
                      <ClockRegular />
                      <Text size={200}>Duration: {quiz.duration} mins</Text>
                    </div>

                    {quiz.score !== null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: tokens.colorPaletteGreenForeground1, fontSize: '13px' }}>
                        <RewardRegular />
                        <Text weight="semibold">
                          Score: {quiz.score}/{quiz.totalmarks}
                        </Text>
                      </div>
                    )}

                    <div>
                      {getStatusBadge(quiz.resolvedStatus)}
                    </div>

                    <ChevronRightRegular style={{ fontSize: '20px', color: tokens.colorNeutralStroke1 }} />
                  </div>
                </div>
              </Link>
            ))}

            {filteredQuizzes.length === 0 && (
              <div className={styles.emptyState}>
                <QuizNewRegular style={{ fontSize: '48px', color: tokens.colorNeutralStroke1 }} />
                <div>
                  <Text weight="semibold" block>No Quizzes Found</Text>
                  <Text size={200}>There are no quizzes matching your selection.</Text>
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </StudentPageState>
  );
}
