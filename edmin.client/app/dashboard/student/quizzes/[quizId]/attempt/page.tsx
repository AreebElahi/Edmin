'use client';

import { useState, useEffect, use } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';

import { useRouter } from 'next/navigation';
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
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogActions,
  ProgressBar,
  Button
} from '@fluentui/react-components';
import { 
  ClockRegular,
  ChevronLeftRegular,
  ChevronRightRegular
} from '@fluentui/react-icons';

const useLocalStyles = makeStyles({
  layoutGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '24px',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    }
  },
  mainCard: {
    position: 'relative',
    backgroundColor: tokens.colorNeutralBackground1,
    padding: '24px',
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow2,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  headerStrip: {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '4px',
    backgroundImage: `linear-gradient(to right, ${tokens.colorBrandBackground}, ${tokens.colorBrandBackgroundHover})`,
  },
  questionCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    padding: '24px',
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow2,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  questionHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
  },
  questionNumber: {
    width: '36px',
    height: '36px',
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    borderRadius: tokens.borderRadiusMedium,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: tokens.fontWeightBold,
    flexShrink: 0,
  },
  optionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  optionItem: {
    width: '100%',
    padding: '16px',
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    transitionProperty: 'all',
    transitionDuration: '150ms',
  },
  optionUnselected: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('2px', 'solid', tokens.colorNeutralStroke1),
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      ...shorthands.borderColor(tokens.colorBrandStroke1),
    }
  },
  optionSelected: {
    backgroundColor: tokens.colorBrandBackground2,
    ...shorthands.border('2px', 'solid', tokens.colorBrandStroke1),
  },
  radioOuter: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioOuterUnselected: {
    border: `2px solid ${tokens.colorNeutralStrokeAccessible}`,
  },
  radioOuterSelected: {
    border: `2px solid ${tokens.colorBrandStroke1}`,
    backgroundColor: tokens.colorBrandBackground,
  },
  radioInner: {
    width: '8px',
    height: '8px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: '50%',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  timerCard: {
    padding: '20px',
    borderRadius: tokens.borderRadiusMedium,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  timerNormal: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('2px', 'solid', tokens.colorNeutralStroke1),
  },
  timerUrgent: {
    backgroundColor: tokens.colorPaletteRedBackground2,
    ...shorthands.border('2px', 'solid', tokens.colorPaletteRedBorder2),
  },
  timerText: {
    fontSize: '36px',
    fontWeight: tokens.fontWeightBold,
  },
  sidebarCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    padding: '20px',
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow2,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  navigatorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '8px',
  },
  navButton: {
    height: '36px',
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    fontWeight: tokens.fontWeightSemibold,
  },
  navButtonCurrent: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorBrandStroke1),
  },
  navButtonAnswered: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    ...shorthands.border('1px', 'solid', tokens.colorBrandStroke2),
  },
  navButtonDefault: {
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    }
  }
});

export default function QuizAttemptPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = use(params);
  const styles = useStudentStyles();
  const localStyles = useLocalStyles();
  const router = useRouter();
  const { profile, notifications } = useStudent();

  const [quiz, setQuiz] = useState<StudentTypes.StudentQuizDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({}); // questionbankid -> selectedoptionid
  const [timeRemaining, setTimeRemaining] = useState(0); // seconds
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const id = parseInt(quizId);
        const quizData = await StudentAPI.getQuizDetail(id);

        if (quizData.attempted) {
          router.replace(`/dashboard/student/quizzes/${id}/result`);
          return;
        }

        const mappedQuiz = {
          ...quizData,
          quizid: (quizData as any).quizid || (quizData as any).quizId,
        };
        setQuiz(mappedQuiz as any);
        setTimeRemaining(quizData.duration * 60);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load quiz attempt screen');
      } finally {
        setLoading(false);
      }
    };
    loadQuiz();
  }, [quizId, router]);

  useEffect(() => {
    if (timeRemaining <= 0 || loading || error || !quiz) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining, loading, error, quiz]);

  // Anti-cheat visibility monitoring
  useEffect(() => {
    if (loading || error || !quiz) return;

    const handleViolation = async () => {
      try {
        console.warn('Violation detected, reporting to server...');
        await StudentAPI.reportQuizViolation(quiz.quizid);
      } catch (err) {
        console.error('Failed to report violation', err);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleViolation();
      }
    };

    const handleBlur = () => {
      handleViolation();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [loading, error, quiz]);

  const handleSubmitQuiz = async () => {
    if (!quiz) return;
    setIsSubmitting(true);
    try {
      const answersArray: StudentTypes.QuizAttemptAnswer[] = quiz.questions.map(q => ({
        questionId: q.quizquestionid,
        selectedOptionId: answers[q.quizquestionid] || 0,
      }));

      await StudentAPI.submitQuizAttempt(quiz.quizid, answersArray);
      router.push(`/dashboard/student/quizzes/${quiz.quizid}/result`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit quiz attempt');
      setIsSubmitting(false);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const userName = profile?.student?.fullname || 'Student';
  const mappedNotifications = (notifications || []).map((n) => ({
    id: n.notificationid.toString(),
    title: n.title,
    message: n.message,
    timestamp: new Date(n.createdat),
    read: n.isread,
    type: 'info' as const
  }));

  const activeQuestion = quiz?.questions[currentIdx];
  const totalQuestions = quiz?.questions.length || 0;
  const answeredCount = Object.keys(answers).length;
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const isUrgent = timeRemaining < 300; // Urgent under 5 minutes

  return (
    <StudentPageState loading={loading} error={error || (!quiz ? 'Quiz not found' : null)} currentPath={`/dashboard/student/quizzes/${quizId}/attempt`} layoutWrapper={true}>
      {quiz && (
        <DashboardLayout
          userRole={UserRole.STUDENT}
          userName={userName}
          notifications={mappedNotifications}
          currentPath={`/dashboard/student/quizzes/${quizId}/attempt`}
        >
          <div className={styles.container}>
            {/* Main Grid */}
            <div className={localStyles.layoutGrid}>
              {/* Active Question Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Header Card */}
                <div className={localStyles.mainCard}>
                  <div className={localStyles.headerStrip}></div>
                  <div>
                    <Title1 block style={{ margin: '0' }}>{quiz.title}</Title1>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginTop: '4px' }} block>
                      Question {currentIdx + 1} of {totalQuestions}
                    </Text>
                  </div>

                  {/* Progress */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text size={100}>Attempt Progress</Text>
                      <Text size={100} weight="semibold">{answeredCount} of {totalQuestions} Answered</Text>
                    </div>
                    <ProgressBar value={progressPercent / 100} color="brand" />
                  </div>
                </div>

                {/* Question Card */}
                {activeQuestion && (
                  <div className={localStyles.questionCard}>
                    <div className={localStyles.questionHeader}>
                      <div className={localStyles.questionNumber}>{currentIdx + 1}</div>
                      <Title3>{activeQuestion.questiontext}</Title3>
                    </div>

                    <div className={localStyles.optionsList}>
                      {activeQuestion.options.map((option) => {
                        const isSelected = answers[activeQuestion.quizquestionid] === option.quizoptionid;
                        return (
                          <div 
                            key={option.quizoptionid} 
                            className={`${localStyles.optionItem} ${isSelected ? localStyles.optionSelected : localStyles.optionUnselected}`}
                            onClick={() => setAnswers(prev => ({ ...prev, [activeQuestion.quizquestionid]: option.quizoptionid }))}
                          >
                            <div className={`${localStyles.radioOuter} ${isSelected ? localStyles.radioOuterSelected : localStyles.radioOuterUnselected}`}>
                              {isSelected && <div className={localStyles.radioInner}></div>}
                            </div>
                            <Text weight={isSelected ? 'bold' : 'regular'}>{option.optiontext}</Text>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button 
                    icon={<ChevronLeftRegular />}
                    disabled={currentIdx === 0}
                    onClick={() => setCurrentIdx(prev => prev - 1)}
                  >
                    Previous
                  </Button>
                  <Button 
                    icon={<ChevronRightRegular />}
                    iconPosition="after"
                    disabled={currentIdx === totalQuestions - 1}
                    onClick={() => setCurrentIdx(prev => prev + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>

              {/* Timer and Navigator Sidebar */}
              <div className={localStyles.sidebar}>
                {/* Timer Card */}
                <div className={`${localStyles.timerCard} ${isUrgent ? localStyles.timerUrgent : localStyles.timerNormal}`}>
                  <ClockRegular style={{ fontSize: '20px', color: isUrgent ? tokens.colorPaletteRedForeground1 : tokens.colorNeutralForeground3 }} />
                  <Text size={200} weight="semibold" style={{ color: isUrgent ? tokens.colorPaletteRedForeground1 : 'inherit' }}>
                    Time Remaining
                  </Text>
                  <div className={localStyles.timerText} style={{ color: isUrgent ? tokens.colorPaletteRedForeground1 : 'inherit' }}>
                    {formatTime(timeRemaining)}
                  </div>
                </div>

                {/* Navigator Card */}
                <div className={localStyles.sidebarCard}>
                  <Title3>Question Map</Title3>
                  <div className={localStyles.navigatorGrid}>
                    {quiz.questions.map((q, idx) => {
                      const isCurrent = idx === currentIdx;
                      const isAnswered = answers[q.quizquestionid] !== undefined;
                      
                      let btnClass = localStyles.navButtonDefault;
                      if (isCurrent) {
                        btnClass = localStyles.navButtonCurrent;
                      } else if (isAnswered) {
                        btnClass = localStyles.navButtonAnswered;
                      }

                      return (
                        <button
                          key={q.quizquestionid}
                          className={`${localStyles.navButton} ${btnClass}`}
                          onClick={() => setCurrentIdx(idx)}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit quiz Button */}
                <Dialog open={isSubmitConfirmOpen} onOpenChange={(_, data) => setIsSubmitConfirmOpen(data.open)}>
                  <DialogTrigger disableButtonEnhancement>
                    <Button appearance="primary" size="large" style={{ width: '100%' }}>
                      Submit Quiz Attempt
                    </Button>
                  </DialogTrigger>
                  <DialogSurface>
                    <DialogTitle>Confirm Quiz Submission</DialogTitle>
                    <DialogContent>
                      <Text>
                        You have answered {answeredCount} out of {totalQuestions} questions. Are you sure you want to submit? 
                        {answeredCount < totalQuestions && ' Unanswered questions will receive 0 marks.'}
                      </Text>
                    </DialogContent>
                    <DialogActions>
                      <Button appearance="secondary" onClick={() => setIsSubmitConfirmOpen(false)} disabled={isSubmitting}>
                        Keep Attempting
                      </Button>
                      <Button appearance="primary" onClick={handleSubmitQuiz} disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Submit Attempt'}
                      </Button>
                    </DialogActions>
                  </DialogSurface>
                </Dialog>
              </div>
            </div>
          </div>
        </DashboardLayout>
      )}
    </StudentPageState>
  );
}
