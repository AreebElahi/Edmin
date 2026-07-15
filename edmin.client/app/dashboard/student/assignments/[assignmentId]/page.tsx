'use client';

import { useState, useEffect, use } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import Link from 'next/link';
import { StudentAPI } from '@/utils/api';
import { apiGet } from '@/api/apiContract';
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
  ArrowLeftRegular, 
  RewardRegular, 
  DocumentRegular, 
  ChatRegular, 
  ArrowUploadRegular,
  DeleteRegular
} from '@fluentui/react-icons';

export default function AssignmentDetailPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = use(params);
  const styles = useStudentStyles();
  const { profile, notifications } = useStudent();

  const [assignment, setAssignment] = useState<StudentTypes.StudentAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [unsubmitting, setUnsubmitting] = useState(false);

  const handleUnsubmit = async () => {
    if (!window.confirm("Are you sure you want to un-submit your work? This action cannot be undone.")) return;
    
    try {
      setUnsubmitting(true);
      const id = parseInt(assignmentId);
      await StudentAPI.unsubmitAssignment(id);
      
      // Reload assignment data to reflect un-submitted state
      const assignmentData = await StudentAPI.getAssignmentDetail(id);
      const mappedData = {
        assignmentid: assignmentData.assignmentid || (assignmentData as any).assignmentId,
        title: assignmentData.title,
        duedate: assignmentData.duedate,
        maxmarks: assignmentData.maxmarks,
        description: assignmentData.description || null,
        courseName: (assignmentData as any).course?.name || '',
        courseCode: (assignmentData as any).course?.code || '',
        submission: assignmentData.submission
      };
      setAssignment(mappedData as any);
      alert("Submission successfully removed.");
    } catch (err: any) {
      console.error('Failed to un-submit:', err);
      alert('Failed to un-submit: ' + (err.message || 'Unknown error'));
    } finally {
      setUnsubmitting(false);
    }
  };

  const handleDownload = async () => {
    let url = assignment?.submission?.downloadUrl || assignment?.submission?.fileurl;
    if (!url) return;
    
    // apiClient.ts baseURL already includes /api/v1. Prevent /api/v1/api/v1 duplicate.
    if (url.startsWith('/api/v1')) {
      url = url.replace('/api/v1', '');
    }

    try {
      setDownloading(true);
      const res = await apiGet<{ url: string; expiresIn: number }>(url);
      if (res.url) {
        window.open(res.url, '_blank');
      }
    } catch (err: any) {
      console.error('Failed to download file:', err);
      alert('Failed to download file: ' + (err.message || 'Unknown error'));
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    const loadAssignment = async () => {
      try {
        const id = parseInt(assignmentId);
        const assignmentData = await StudentAPI.getAssignmentDetail(id);
        const mappedData = {
          assignmentid: assignmentData.assignmentid || (assignmentData as any).assignmentId,
          title: assignmentData.title,
          duedate: assignmentData.duedate,
          maxmarks: assignmentData.maxmarks,
          description: assignmentData.description || null,
          courseName: (assignmentData as any).course?.name || '',
          courseCode: (assignmentData as any).course?.code || '',
          submission: assignmentData.submission
        };
        setAssignment(mappedData as any);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load assignment details');
      } finally {
        setLoading(false);
      }
    };
    loadAssignment();
  }, [assignmentId]);

  const userName = profile?.student?.fullname || 'Student';
  const mappedNotifications = (notifications || []).map((n) => ({
    id: n.notificationid.toString(),
    title: n.title,
    message: n.message,
    timestamp: new Date(n.createdat),
    read: n.isread,
    type: 'info' as const
  }));

  const isSubmitted = !!assignment?.submission;
  const isGraded = assignment?.submission?.status === 'GRADED' || assignment?.submission?.marksawarded !== null;
  const isOverdue = assignment ? new Date(assignment.duedate) < new Date() : false;

  return (
    <StudentPageState loading={loading} error={error || (!assignment ? 'Assignment not found' : null)} currentPath={`/dashboard/student/assignments/${assignmentId}`} layoutWrapper={true}>
      {assignment && (
        <DashboardLayout
          userRole={UserRole.STUDENT}
          userName={userName}
          notifications={mappedNotifications}
          currentPath={`/dashboard/student/assignments/${assignmentId}`}
        >
          <div className={styles.container}>
            {/* Breadcrumb */}
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <Link href="/dashboard/student" className={styles.breadcrumbLink}>
                <HomeRegular style={{ marginRight: '4px' }} /> Home
              </Link>
              <span className={styles.breadcrumbSeparator}>/</span>
              <Link href="/dashboard/student/assignments" className={styles.breadcrumbLink}>
                Assignments
              </Link>
              <span className={styles.breadcrumbSeparator}>/</span>
              <span className={styles.breadcrumbActive}>Details</span>
            </nav>

            {/* Back Button */}
            <div>
              <Link href="/dashboard/student/assignments" style={{ textDecoration: 'none' }}>
                <Button icon={<ArrowLeftRegular />}>Back to Assignments</Button>
              </Link>
            </div>

            {/* Main Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: '24px',
            }}>
              {/* Instructions Column */}
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
                      {assignment.courseCode}
                    </Badge>
                    <Title1 block style={{ margin: '0' }}>{assignment.title}</Title1>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginTop: '4px' }} block>
                      Course: {assignment.courseName}
                    </Text>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {isGraded ? (
                      <Badge color="success">Graded</Badge>
                    ) : isSubmitted ? (
                      <Badge color="brand">Submitted</Badge>
                    ) : isOverdue ? (
                      <Badge color="danger">Overdue</Badge>
                    ) : (
                      <Badge color="warning">Pending</Badge>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', borderTop: `1px solid ${tokens.colorNeutralStroke2}`, borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, padding: '12px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: tokens.colorNeutralForeground2 }}>
                    <ClockRegular />
                    <Text>
                      Due: <Text weight="semibold">{new Date(assignment.duedate).toLocaleString()}</Text>
                    </Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: tokens.colorNeutralForeground2 }}>
                    <RewardRegular />
                    <Text>
                      Max Marks: <Text weight="semibold">{assignment.maxmarks}</Text>
                    </Text>
                  </div>
                </div>

                <div>
                  <Title3 block style={{ marginBottom: '8px' }}>Instructions</Title3>
                  <div style={{
                    padding: '16px',
                    backgroundColor: tokens.colorNeutralBackground2,
                    borderRadius: tokens.borderRadiusMedium,
                    border: `1px solid ${tokens.colorNeutralStroke2}`,
                    minHeight: '120px',
                    whiteSpace: 'pre-wrap',
                  }}>
                    <Text>{assignment.description || 'No detailed instructions provided by instructor.'}</Text>
                  </div>
                </div>
              </div>

              {/* Submission and Grading Sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Submission card */}
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
                  <Title3>Submission</Title3>

                  {!isSubmitted ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', textAlign: 'center', padding: '16px 0' }}>
                      <DocumentRegular style={{ fontSize: '48px', color: tokens.colorNeutralStroke1 }} />
                      <div>
                        <Text weight="semibold" block>Not Submitted Yet</Text>
                        <Text size={200}>Submit your completed work before the deadline.</Text>
                      </div>
                      <Link href={`/dashboard/student/assignments/${assignmentId}/submit`} style={{ width: '100%' }}>
                        <Button icon={<ArrowUploadRegular />} appearance="primary" style={{ width: '100%' }}>
                          Upload Work
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <MessageBar intent="success">
                        <MessageBarTitle>Work Submitted</MessageBarTitle>
                        {assignment.submission?.submittedat && (
                          <MessageBarBody>
                            On {new Date(assignment.submission.submittedat).toLocaleString()}
                          </MessageBarBody>
                        )}
                      </MessageBar>

                      {(assignment.submission?.downloadUrl || assignment.submission?.fileurl) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: tokens.colorNeutralBackground2, borderRadius: tokens.borderRadiusMedium }}>
                          <DocumentRegular style={{ fontSize: '24px', color: tokens.colorBrandForeground1 }} />
                          <div style={{ flexGrow: 1, minWidth: 0 }}>
                            <Text truncate weight="semibold" block size={200}>
                              {(assignment.submission?.downloadUrl || assignment.submission?.fileurl || '').split('/').pop() || 'submitted_file.pdf'}
                            </Text>
                          </div>
                          <Button size="small" onClick={handleDownload} disabled={downloading}>
                            {downloading ? 'Loading...' : 'View / Download'}
                          </Button>
                        </div>
                      )}

                      {!isGraded && (
                        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                          <Link href={`/dashboard/student/assignments/${assignmentId}/submit`} style={{ flex: 1 }}>
                            <Button icon={<ArrowUploadRegular />} style={{ width: '100%' }}>
                              Edit Submission
                            </Button>
                          </Link>
                          <Button 
                            icon={<DeleteRegular />} 
                            appearance="secondary" 
                            style={{ flex: 1, color: tokens.colorPaletteRedForeground1 }} 
                            onClick={handleUnsubmit}
                            disabled={unsubmitting}
                          >
                            {unsubmitting ? 'Un-submitting...' : 'Un-submit'}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Grading card if graded */}
                {isGraded && (
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
                    <Title3>Grading & Feedback</Title3>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      <Text size={600} weight="bold">
                        {assignment.submission?.marksawarded}
                      </Text>
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                        / {assignment.maxmarks} points
                      </Text>
                    </div>

                    {assignment.submission?.feedback && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', backgroundColor: tokens.colorNeutralBackground2, borderRadius: tokens.borderRadiusMedium, border: `1px solid ${tokens.colorNeutralStroke2}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ChatRegular style={{ color: tokens.colorNeutralForeground3 }} />
                          <Text size={200} weight="semibold">Instructor Feedback</Text>
                        </div>
                        <Text italic size={200}>
                          &ldquo;{assignment.submission.feedback}&rdquo;
                        </Text>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DashboardLayout>
      )}
    </StudentPageState>
  );
}
