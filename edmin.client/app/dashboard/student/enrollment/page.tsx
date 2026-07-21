'use client';

import { useState, useEffect } from 'react';
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
  MessageBar,
  MessageBarTitle,
  MessageBarBody,
  Button,
  Input
} from '@fluentui/react-components';
import { 
  HomeRegular, 
  ClockRegular,
  SearchRegular,
  PersonRegular,
  CheckmarkCircleRegular
} from '@fluentui/react-icons';

export default function EnrollmentPage() {
  const styles = useStudentStyles();
  const { profile, notifications } = useStudent();
  
  const [offerings, setOfferings] = useState<StudentTypes.CourseOffering[]>([]);
  const [requests, setRequests] = useState<StudentTypes.EnrollmentRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEnrollmentData = async () => {
    try {
      const [offeringsData, requestsData] = await Promise.all([
        StudentAPI.getAvailableOfferings(),
        StudentAPI.getMyEnrollmentRequests(),
      ]);

      const mappedOfferings = (offeringsData || []).map((offering: any) => ({
        courseofferingid: offering.courseofferingid,
        courseName: offering.course?.name || '',
        courseCode: offering.course?.code || '',
        credits: offering.course?.credits || 0,
        semesterName: offering.semester?.name || 'N/A',
      }));

      setOfferings(mappedOfferings);
      setRequests(requestsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load enrollment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnrollmentData();
  }, []);

  const handleEnroll = async (offeringId: number) => {
    try {
      await StudentAPI.submitEnrollmentRequest(offeringId);
      const updatedRequests = await StudentAPI.getMyEnrollmentRequests();
      setRequests(updatedRequests);
      alert('Enrollment request submitted successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit enrollment request');
    }
  };

  const getRequestStatus = (offeringId: number) => {
    const req = requests.find(r => r.courseofferingid === offeringId);
    return req ? req.status : null;
  };

  const filteredOfferings = offerings.filter(c =>
    c.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.courseCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    <StudentPageState loading={loading} error={error} currentPath="/dashboard/student/enrollment" layoutWrapper={true}>
      <DashboardLayout
        userRole={UserRole.STUDENT}
        userName={userName}
        notifications={mappedNotifications}
        currentPath="/dashboard/student/enrollment"
      >
        <div className={styles.container}>
          {/* Breadcrumb */}
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/dashboard/student" className={styles.breadcrumbLink}>
              <HomeRegular style={{ marginRight: '4px' }} /> Home
            </Link>
            <span className={styles.breadcrumbSeparator}>/</span>
            <span className={styles.breadcrumbActive}>Enrollment</span>
          </nav>

          {/* Header Card */}
          <div className={styles.headerCard}>
            <div className={styles.headerStrip}></div>
            <div>
              <Title1>Course Enrollment</Title1>
              <Subtitle1 block style={{ color: tokens.colorNeutralForeground2, marginTop: '4px' }}>
                Select from available course offerings to register for classes.
              </Subtitle1>
            </div>
            <div>
              <Badge appearance="filled" color="warning">Deadline: priority registrations active</Badge>
            </div>
          </div>

          {/* Search */}
          <div>
            <Input 
              contentBefore={<SearchRegular />}
              placeholder="Search by course name or code..."
              style={{ width: '100%' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="large"
            />
          </div>

          {/* Grid of Offerings */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px'
          }}>
            {filteredOfferings.map((offering) => {
              const requestedStatus = getRequestStatus(offering.courseofferingid);
              return (
                <div 
                  key={offering.courseofferingid} 
                  style={{
                    backgroundColor: tokens.colorNeutralBackground1,
                    border: `1px solid ${tokens.colorNeutralStroke1}`,
                    borderRadius: tokens.borderRadiusMedium,
                    boxShadow: tokens.shadow2,
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '180px',
                    transitionProperty: 'all',
                    transitionDuration: '200ms',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Badge color="brand" appearance="outline">{offering.courseCode}</Badge>
                      <Badge color="subtle" appearance="filled">{offering.credits} CH</Badge>
                    </div>
                    <Title3>{offering.courseName}</Title3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', flexGrow: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <PersonRegular style={{ fontSize: '16px', color: tokens.colorNeutralForeground3 }} />
                      <Text size={200}>Instructor: TBA / Faculty Assigned</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ClockRegular style={{ fontSize: '16px', color: tokens.colorNeutralForeground3 }} />
                      <Text size={200}>Semester: {offering.semesterName}</Text>
                    </div>
                  </div>

                  <div>
                    {!requestedStatus ? (
                      <Button 
                        appearance="primary" 
                        style={{ width: '100%' }}
                        onClick={() => handleEnroll(offering.courseofferingid)}
                      >
                        Enroll Now
                      </Button>
                    ) : ['PENDING', 'SUBMITTED', 'PENDING_SUPERVISOR'].includes(requestedStatus) ? (
                      <Button 
                        appearance="outline" 
                        style={{ width: '100%', borderColor: tokens.colorPaletteYellowBorder1, color: tokens.colorPaletteYellowForeground1 }}
                        disabled
                      >
                        Pending HOD Approval
                      </Button>
                    ) : ['ENROLLED', 'APPROVED'].includes(requestedStatus) ? (
                      <Button 
                        appearance="outline" 
                        style={{ width: '100%', borderColor: tokens.colorPaletteGreenBorder1, color: tokens.colorPaletteGreenForeground1 }}
                        disabled
                        icon={<CheckmarkCircleRegular />}
                      >
                        Already Registered
                      </Button>
                    ) : (
                      <Button 
                        appearance="outline" 
                        style={{ width: '100%' }}
                        disabled
                      >
                        {requestedStatus}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredOfferings.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px' }}>
                <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
                  No courses match your search or no offerings are available.
                </Text>
              </div>
            )}
          </div>

          {/* Info Note */}
          <MessageBar intent="info">
            <MessageBarTitle>Supervisor Approval Workflow</MessageBarTitle>
            <MessageBarBody>
              Course enrollment requests are sent to the program HOD / coordinator for verification.
              Once approved, you will be enrolled automatically and your weekly calendar schedule will be updated.
            </MessageBarBody>
          </MessageBar>
        </div>
      </DashboardLayout>
    </StudentPageState>
  );
}
