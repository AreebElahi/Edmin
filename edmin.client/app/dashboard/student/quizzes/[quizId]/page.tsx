'use client';

import { useState, useEffect, use } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StudentAPI } from '@/utils/api';
import * as StudentTypes from '@/types/student';
import { useStudent } from '../../StudentContext';
import { useStudentStyles } from '@/hooks/useStudentStyles';
import StudentPageState from '@/components/StudentPageState';
import { 
  tokens, 
  Text, 
  Title1, 
  Title3,
  Badge,
  MessageBar,
  MessageBarTitle,
  MessageBarBody,
  Button
} from '@fluentui/react-components';
import { 
  HomeRegular, 
  ClockRegular,
  CheckmarkCircleRegular,
  ArrowLeftRegular,
  RewardRegular,
  ArrowRightRegular
} from '@fluentui/react-icons';

export default function QuizDetailPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = use(params);
  const styles = useStudentStyles();
  const router = useRouter();
  const { profile, notifications } = useStudent();

  const [quiz, setQuiz] = useState<StudentTypes.StudentQuizDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const id = parseInt(quizId);
        const quizData = await StudentAPI.getQuizDetail(id);
        const mappedQuiz = {
          quizid: quizData.quizid || (quizData as any).quizId,
          title: quizData.title,
          duration: quizData.duration,
          totalmarks: quizData.totalmarks,
          description: quizData.description || null,
          courseName: (quizData as any).course?.name || '',
          courseCode: (quizData as any).course?.code || '',
          attempted: quizData.attempted || false,
          score: quizData.score || null,
          submittedat: quizData.submittedat || null,
          questions: quizData.questions
        };
        setQuiz(mappedQuiz as any);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load quiz details');
      } finally {
        setLoading(false);
      }
    };
    loadQuiz();
  }, [quizId]);

  const userName = profile?.student?.fullname || 'Student';
  const mappedNotifications = (notifications || []).map((n) => ({
    id: n.notificationid.toString(),
    title: n.title,
    message: n.message,
    timestamp: new Date(n.createdat),
    read: n.isread,
    type: 'info' as const
  }));

  const isAttempted = quiz?.attempted || false;

  return (
    <StudentPageState loading={loading} error={error || (!quiz ? 'Quiz not found' : null)} currentPath={`/dashboard/student/quizzes/${quizId}`} layoutWrapper={true}>
      {quiz && (
        <DashboardLayout
          userRole={UserRole.STUDENT}
          userName={userName}
          notifications={mappedNotifications}
          currentPath={`/dashboard/student/quizzes/${quizId}`}
        >
          <div className={styles.container}>
            {/* Breadcrumb */}
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <Link href="/dashboard/student" className={styles.breadcrumbLink}>
                <HomeRegular style={{ marginRight: '4px' }} /> Home
              </Link>
              <span className={styles.breadcrumbSeparator}>/</span>
              <Link href="/dashboard/student/quizzes" className={styles.breadcrumbLink}>
                Quizzes
              </Link>
              <span className={styles.breadcrumbSeparator}>/</span>
              <span className={styles.breadcrumbActive}>Details</span>
            </nav>

            {/* Back Link */}
            <div>
              <Link href="/dashboard/student/quizzes" style={{ textDecoration: 'none' }}>
                <Button icon={<ArrowLeftRegular />}>Back to Quizzes</Button>
              </Link>
            </div>

            {/* Main Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: '24px',
            }}>
              {/* Instructions and Details */}
              <div style={{
                backgroundColor: tokens.colorNeutralBackground1,
                padding: '24px',
                border: `1px solid ${tokens.colorNeutralStroke1}`,
                borderRadius: tokens.borderRadiusMedium,
                boxShadow: tokens.shadow2,
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  width: '100%',
                  height: '4px',
                  backgroundImage: `linear-gradient(to right, ${tokens.colorBrandBackground}, ${tokens.colorBrandBackgroundHover})`,
                }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <Badge color="brand" appearance="outline" style={{ marginBottom: '8px' }}>
                      {quiz.courseCode}
                    </Badge>
                    <Title1 block style={{ margin: '0' }}>{quiz.title}</Title1>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginTop: '4px' }} block>
                      Course: {quiz.courseName}
                    </Text>
                  </div>

                  <div>
                    {isAttempted ? (
                      <Badge color="success">Completed</Badge>
                    ) : (
                      <Badge color="brand">Available</Badge>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', borderTop: `1px solid ${tokens.colorNeutralStroke2}`, borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, padding: '12px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: tokens.colorNeutralForeground2 }}>
                    <ClockRegular />
                    <Text>
                      Duration: <Text weight="semibold">{quiz.duration} mins</Text>
                    </Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: tokens.colorNeutralForeground2 }}>
                    <RewardRegular />
                    <Text>
                      Points: <Text weight="semibold">{quiz.totalmarks}</Text>
                    </Text>
                  </div>
                </div>

                <div>
                  <Title3 block style={{ marginBottom: '8px' }}>Description</Title3>
                  <Text>{quiz.description || 'No description provided.'}</Text>
                </div>

                <MessageBar intent="warning">
                  <MessageBarTitle>Quiz Guidelines</MessageBarTitle>
                  <MessageBarBody>
                    • Once you click &ldquo;Start Attempt&rdquo;, the timer will begin counting down.<br/>
                    • You cannot pause or exit the quiz after it starts.<br/>
                    • Be sure you have a reliable internet connection before starting.
                  </MessageBarBody>
                </MessageBar>
              </div>

              {/* Action Sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  backgroundColor: tokens.colorNeutralBackground1,
                  padding: '20px',
                  border: `1px solid ${tokens.colorNeutralStroke1}`,
                  borderRadius: tokens.borderRadiusMedium,
                  boxShadow: tokens.shadow2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}>
                  <Title3>Attempt Summary</Title3>

                  {isAttempted ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <MessageBar intent="success">
                        <MessageBarTitle>Quiz Finished</MessageBarTitle>
                        {quiz.submittedat && (
                          <MessageBarBody>
                            Submitted on {new Date(quiz.submittedat).toLocaleDateString()}
                          </MessageBarBody>
                        )}
                      </MessageBar>

                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <Text size={600} weight="bold">{quiz.score}</Text>
                        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>/ {quiz.totalmarks} points</Text>
                      </div>

                      <Button 
                        appearance="primary" 
                        icon={<CheckmarkCircleRegular />}
                        onClick={() => router.push(`/dashboard/student/quizzes/${quizId}/result`)}
                      >
                        View Result Breakdown
                      </Button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <Text size={200}>You have not attempted this quiz yet.</Text>
                      <Button 
                        appearance="primary" 
                        icon={<ArrowRightRegular />}
                        onClick={() => router.push(`/dashboard/student/quizzes/${quizId}/attempt`)}
                      >
                        Start Quiz Attempt
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DashboardLayout>
      )}
    </StudentPageState>
  );
}
