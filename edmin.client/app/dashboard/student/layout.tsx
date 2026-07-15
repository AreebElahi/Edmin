'use client';

import React from 'react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { StudentProvider } from './StudentContext';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <FluentProvider theme={webLightTheme}>
      <StudentProvider>
        {children}
      </StudentProvider>
    </FluentProvider>
  );
}
