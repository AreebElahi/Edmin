'use client';

import { Suspense } from 'react';
import CourseContent from './CourseContent';
import { Spinner, tokens } from '@fluentui/react-components';

export default function CoursePage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        height: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: tokens.colorNeutralBackground2,
      }}>
        <Spinner label="Loading course resources..." />
      </div>
    }>
      <CourseContent />
    </Suspense>
  );
}
