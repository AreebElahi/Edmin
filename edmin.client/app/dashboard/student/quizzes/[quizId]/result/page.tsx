'use client';

import { useState, useEffect, use } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import Link from 'next/link';
import { StudentAPI } from '@/utils/api';
import * as StudentTypes from '@/types/student';
import { useStudent } from '../../../StudentContext';
import { useStudentStyles } from '@/hooks/useStudentStyles';
import StudentPageState from '@/components/StudentPageState';
import { 
  makeStyles,
  tokens, 
  shorthands,
  Text, 
  Title1, 
  Title3,
  Subtitle1,
  Badge,
  Button
} from '@fluentui/react-components';
import { 
  HomeRegular, 
  ClockRegular,
  ArrowLeftRegular,
  RewardRegular,
  CalendarRegular
} from '@fluentui/react-icons';

const useLocalStyles = makeStyles({
  banner: {
    position: 'relative',
    backgroundColor: tokens.colorNeutralBackground1,
    padding: '32px',
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '12px',
  },
  headerStrip: {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '4px',
    backgroundImage: `linear-gradient(to right, ${tokens.colorBrandBackground}, ${tokens.colorBrandBackgroundHover})`,
  },
  layoutGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '24px',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    }
  },
  scoreCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    padding: '24px',
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow2,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  scoreValue: {
    fontSize: '48px',
    fontWeight: tokens.fontWeightBold,
  },
  pillGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '12px',
  },
  pillCardCorrect: {
    padding: '12px',
    borderRadius: tokens.borderRadiusMedium,
    textAlign: 'center',
    backgroundColor: tokens.colorPaletteGreenBackground2,
  },
  pillCardIncorrect: {
    padding: '12px',
    borderRadius: tokens.borderRadiusMedium,
    textAlign: 'center',
    backgroundColor: tokens.colorPaletteRedBackground2,
  },
  pillCardPercentage: {
    padding: '12px',
    borderRadius: tokens.borderRadiusMedium,
    textAlign: 'center',
    backgroundColor: tokens.colorBrandBackground2,
  },
  infoCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    padding: '20px',
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow2,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: tokens.colorNeutralForeground2,
  },
  reviewSection: {
    backgroundColor: tokens.colorNeutralBackground1,
    padding: '24px',
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow2,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  questionResultCardCorrect: {
    padding: '20px',
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.border('1px', 'solid', tokens.colorPaletteGreenBorder1),
    backgroundColor: tokens.colorPaletteGreenBackground1,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  questionResultCardIncorrect: {
    padding: '20px',
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.border('1px', 'solid', tokens.colorPaletteRedBorder1),
    backgroundColor: tokens.colorPaletteRedBackground1,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  optionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  optionItemDefault: {
    padding: '12px',
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    backgroundColor: tokens.colorNeutralBackground1,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  optionItemCorrect: {
    padding: '12px',
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.border('1px', 'solid', tokens.colorPaletteGreenBorder1),
    backgroundColor: tokens.colorPaletteGreenBackground2,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  optionItemIncorrect: {
    padding: '12px',
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.border('1px', 'solid', tokens.colorPaletteRedBorder1),
    backgroundColor: tokens.colorPaletteRedBackground2,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  }
});

export default function QuizResultPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = use(params);
  const styles = useStudentStyles();
  const localStyles = useLocalStyles();
  const { profile, notifications } = useStudent();

  const [result, setResult] = useState<StudentTypes.QuizResultResponse | null>(null);
  const [quiz, setQuiz] = useState<StudentTypes.StudentQuizDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadResult = async () => {
      try {
        const id = parseInt(quizId);
        const [resultData, quizData] = await Promise.all([
          StudentAPI.getQuizResult(id),
          StudentAPI.getQuizDetail(id),
        ]);
        setResult(resultData);
        setQuiz(quizData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load quiz results');
      } finally {
        setLoading(false);
      }
    };
    loadResult();
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

  const correctAnswers = result?.answers.filter(a => a.iscorrect).length || 0;
  const incorrectAnswers = (result?.answers.length || 0) - correctAnswers;
  const percentage = result && result.maxmarks > 0 ? (result.score / result.maxmarks) * 100 : 0;

  const durationMins = (() => {
    if (!result) return '0:00';
    const start = new Date(result.startedat).getTime();
    const end = new Date(result.submittedat).getTime();
    const diffMs = end - start;
    if (diffMs <= 0) return '0:00';
    const totalSecs = Math.floor(diffMs / 1000);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  })();

  const getGradeLetter = (pct: number) => {
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B';
    if (pct >= 60) return 'C';
    if (pct >= 50) return 'D';
    return 'F';
  };

  return (
    <StudentPageState loading={loading} error={error || (!result || !quiz ? 'Results not available' : null)} currentPath={`/dashboard/student/quizzes/${quizId}/result`} layoutWrapper={true}>
      {result && quiz && (
        <DashboardLayout
          userRole={UserRole.STUDENT}
          userName={userName}
          notifications={mappedNotifications}
          currentPath={`/dashboard/student/quizzes/${quizId}/result`}
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
              <Link href={`/dashboard/student/quizzes/${quizId}`} className={styles.breadcrumbLink}>
                Details
              </Link>
              <span className={styles.breadcrumbSeparator}>/</span>
              <span className={styles.breadcrumbActive}>Results</span>
            </nav>

            {/* Back Link */}
            <div>
              <Link href={`/dashboard/student/quizzes/${quizId}`} style={{ textDecoration: 'none' }}>
                <Button icon={<ArrowLeftRegular />}>Back to Details</Button>
              </Link>
            </div>

            {/* Completion Banner */}
            <div className={localStyles.banner}>
              <div className={localStyles.headerStrip}></div>
              <RewardRegular style={{ fontSize: '48px', color: tokens.colorBrandForeground1 }} />
              <Title1 block style={{ margin: '0' }}>Quiz Attempt Complete!</Title1>
              <Subtitle1 block style={{ color: tokens.colorNeutralForeground2 }}>
                Your answers have been graded. Here is your academic feedback summary.
              </Subtitle1>
            </div>

            {/* Main Grid */}
            <div className={localStyles.layoutGrid}>
              {/* Score details */}
              <div className={localStyles.scoreCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Title3>Your Performance Report</Title3>
                  <Badge color={percentage >= 50 ? 'success' : 'danger'} size="large">
                    Grade: {getGradeLetter(percentage)}
                  </Badge>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <div className={localStyles.scoreValue}>{result.score}</div>
                  <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>/ {result.maxmarks} points</Text>
                </div>

                <div className={localStyles.pillGrid}>
                  <div className={localStyles.pillCardCorrect}>
                    <Text size={100} weight="semibold" block style={{ color: tokens.colorPaletteGreenForeground1 }}>Correct</Text>
                    <Text weight="bold" size={500} style={{ color: tokens.colorPaletteGreenForeground1 }}>{correctAnswers}</Text>
                  </div>
                  <div className={localStyles.pillCardIncorrect}>
                    <Text size={100} weight="semibold" block style={{ color: tokens.colorPaletteRedForeground1 }}>Incorrect</Text>
                    <Text weight="bold" size={500} style={{ color: tokens.colorPaletteRedForeground1 }}>{incorrectAnswers}</Text>
                  </div>
                  <div className={localStyles.pillCardPercentage}>
                    <Text size={100} weight="semibold" block style={{ color: tokens.colorBrandForeground1 }}>Percentage</Text>
                    <Text weight="bold" size={500} style={{ color: tokens.colorBrandForeground1 }}>{percentage.toFixed(1)}%</Text>
                  </div>
                </div>
              </div>

              {/* Timing details */}
              <div className={localStyles.infoCard}>
                <Title3>Stats</Title3>
                <div className={localStyles.metaItem}>
                  <ClockRegular />
                  <Text>Time taken: <Text weight="semibold">{durationMins} mins</Text></Text>
                </div>
                <div className={localStyles.metaItem}>
                  <CalendarRegular />
                  <Text>
                    Submitted on:{' '}
                    <Text weight="semibold">
                      {new Date(result.submittedat).toLocaleDateString()}
                    </Text>
                  </Text>
                </div>
              </div>
            </div>

            {/* Question Review Section */}
            <div className={localStyles.reviewSection}>
              <Title3>Question Review</Title3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {result.answers.map((answer, index) => {
                  const cardClass = answer.iscorrect 
                    ? localStyles.questionResultCardCorrect 
                    : localStyles.questionResultCardIncorrect;
                  
                  return (
                    <div key={answer.quizanswerid} className={cardClass}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text weight="semibold">Question {index + 1}</Text>
                        <Badge color={answer.iscorrect ? 'success' : 'danger'}>
                          {answer.marksawarded} pts
                        </Badge>
                      </div>

                      <Text size={300} weight="semibold">{answer.questiontext}</Text>

                      <div className={localStyles.optionsList}>
                        {answer.options.map(option => {
                          const isCorrectOption = option.quizoptionid === answer.correctOptionId;
                          const isSelectedOption = option.quizoptionid === answer.selectedOptionId;

                          let itemClass = localStyles.optionItemDefault;
                          if (isCorrectOption) {
                            itemClass = localStyles.optionItemCorrect;
                          } else if (isSelectedOption && !answer.iscorrect) {
                            itemClass = localStyles.optionItemIncorrect;
                          }

                          return (
                            <div key={option.quizoptionid} className={itemClass}>
                              <div style={{ flexGrow: 1 }}>
                                <Text weight={isCorrectOption || isSelectedOption ? 'bold' : 'regular'}>
                                  {option.optiontext}
                                </Text>
                              </div>
                              {isCorrectOption && <Badge color="success">Correct Answer</Badge>}
                              {isSelectedOption && !isCorrectOption && <Badge color="danger">Your Answer</Badge>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </DashboardLayout>
      )}
    </StudentPageState>
  );
}
