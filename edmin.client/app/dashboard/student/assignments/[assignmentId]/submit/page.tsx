'use client';

import { useState, useEffect, useRef, use } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StudentAPI } from '@/utils/api';
import * as StudentTypes from '@/types/student';
import { useStudent } from '../../../StudentContext';
import { useStudentStyles } from '@/hooks/useStudentStyles';
import StudentPageState from '@/components/StudentPageState';
import { 
  tokens, 
  Text, 
  Title1, 
  Title3,
  Subtitle1,
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
  ArrowUploadRegular,
  DismissRegular
} from '@fluentui/react-icons';

export default function AssignmentSubmitPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = use(params);
  const styles = useStudentStyles();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { profile, notifications } = useStudent();

  const [assignment, setAssignment] = useState<StudentTypes.StudentAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const loadAssignment = async () => {
      try {
        const id = parseInt(assignmentId);
        const assignmentData = await StudentAPI.getAssignmentDetail(id);
        setAssignment(assignmentData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load assignment details');
      } finally {
        setLoading(false);
      }
    };
    loadAssignment();
  }, [assignmentId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !assignment) {
      setSubmitError("Please ensure a file is selected and assignment is loaded.");
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const idToSubmit = assignment.assignmentid || (assignment as any).assignmentId;
      await StudentAPI.submitAssignment(idToSubmit, selectedFile);
      setSubmitSuccess(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit assignment');
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <StudentPageState loading={loading} error={error || (!assignment ? 'Assignment not found' : null)} currentPath={`/dashboard/student/assignments/${assignmentId}/submit`} layoutWrapper={true}>
      {assignment && (
        <DashboardLayout
          userRole={UserRole.STUDENT}
          userName={userName}
          notifications={mappedNotifications}
          currentPath={`/dashboard/student/assignments/${assignmentId}/submit`}
        >
          <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
              <Link href={`/dashboard/student/assignments/${assignmentId}`} className={styles.breadcrumbLink}>
                Details
              </Link>
              <span className={styles.breadcrumbSeparator}>/</span>
              <span className={styles.breadcrumbActive}>Submit</span>
            </nav>

            {/* Back Link */}
            <div>
              <Link href={`/dashboard/student/assignments/${assignmentId}`} style={{ textDecoration: 'none' }}>
                <Button icon={<ArrowLeftRegular />}>Back to Details</Button>
              </Link>
            </div>

            {/* Submit Form Card */}
            <div style={{
              backgroundColor: tokens.colorNeutralBackground1,
              padding: '24px',
              border: `1px solid ${tokens.colorNeutralStroke1}`,
              borderRadius: tokens.borderRadiusMedium,
              boxShadow: tokens.shadow2,
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
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
              <div>
                <Badge color="brand" appearance="outline" style={{ marginBottom: '8px' }}>
                  {assignment.courseCode}
                </Badge>
                <Title1 block style={{ margin: '0' }}>Submit Work</Title1>
                <Subtitle1 block style={{ color: tokens.colorNeutralForeground2, marginTop: '4px' }}>
                  Upload your file submission for: <Text weight="bold">{assignment.title}</Text>
                </Subtitle1>
              </div>

              {submitSuccess ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', textAlign: 'center', padding: '24px 0' }}>
                  <DocumentRegular style={{ fontSize: '64px', color: tokens.colorPaletteGreenForeground1 }} />
                  <div>
                    <Title3 block>Assignment Submitted Successfully!</Title3>
                    <Text size={200}>Your coursework has been received. You can now view it or wait for grading.</Text>
                  </div>
                  <Button 
                    appearance="primary" 
                    onClick={() => router.push(`/dashboard/student/assignments/${assignmentId}`)}
                  >
                    Go to Assignment Details
                  </Button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: tokens.colorNeutralForeground2 }}>
                      <ClockRegular />
                      <Text>Due: <Text weight="semibold">{new Date(assignment.duedate).toLocaleString()}</Text></Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: tokens.colorNeutralForeground2 }}>
                      <RewardRegular />
                      <Text>Points: <Text weight="semibold">{assignment.maxmarks}</Text></Text>
                    </div>
                  </div>

                  {/* Upload Input */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    accept=".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg"
                    style={{ display: 'none' }}
                  />

                  {!selectedFile ? (
                    <div 
                      style={{
                        padding: '40px 24px',
                        border: `2px dashed ${tokens.colorNeutralStroke1}`,
                        borderRadius: tokens.borderRadiusMedium,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        backgroundColor: tokens.colorNeutralBackground2,
                        transitionProperty: 'all',
                        transitionDuration: '200ms',
                      }} 
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ArrowUploadRegular style={{ fontSize: '48px', color: tokens.colorBrandForeground1 }} />
                      <div>
                        <Text weight="semibold" block>Click to select assignment file</Text>
                        <Text size={200}>Accepts PDF, DOCX, ZIP, Image up to 20MB</Text>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      padding: '16px',
                      backgroundColor: tokens.colorNeutralBackground2,
                      border: `1px solid ${tokens.colorNeutralStroke1}`,
                      borderRadius: tokens.borderRadiusMedium,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <DocumentRegular style={{ fontSize: '32px', color: tokens.colorBrandForeground1 }} />
                        <div>
                          <Text weight="semibold" block>{selectedFile.name}</Text>
                          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                          </Text>
                        </div>
                      </div>
                      <Button 
                        icon={<DismissRegular />} 
                        appearance="subtle" 
                        onClick={handleRemoveFile} 
                      />
                    </div>
                  )}

                  {/* Requirement Notes */}
                  <MessageBar intent="info">
                    <MessageBarTitle>Academic Integrity Reminder</MessageBarTitle>
                    <MessageBarBody>
                      By submitting this work, you confirm that it is entirely your own creation and adheres to the university&apos;s academic honor code.
                    </MessageBarBody>
                  </MessageBar>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <Button 
                      appearance="secondary" 
                      onClick={() => router.push(`/dashboard/student/assignments/${assignmentId}`)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button 
                      appearance="primary" 
                      disabled={!selectedFile || isSubmitting}
                      onClick={handleSubmit}
                    >
                      {isSubmitting ? 'Submitting...' : 'Upload & Submit'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DashboardLayout>
      )}
    </StudentPageState>
  );
}
