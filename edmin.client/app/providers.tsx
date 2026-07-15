'use client';

import React from 'react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import QueryProvider from '../providers/QueryProvider';
import { AuthProvider } from '../providers/AuthProvider';
import { RBACProvider } from '../providers/RBACProvider';

// Override Fluent tokens to match Edmin M365 palette
const edminTheme = {
  ...webLightTheme,
  colorBrandBackground: '#0078D4',
  colorBrandBackgroundHover: '#106EBE',
  colorBrandBackgroundPressed: '#005A9E',
  colorNeutralBackground1: '#F3F2F1',
  colorNeutralBackground2: '#FAF9F8',
  colorNeutralBackground3: '#EDEBE9',
  colorNeutralForeground1: '#11100F',
  colorNeutralForeground2: '#323130',
  colorNeutralForeground3: '#605E5C',
  colorNeutralStroke1: '#EDEBE9',
  colorNeutralStroke2: '#D2D0CE',
  borderRadiusMedium: '2px',
  borderRadiusSmall: '2px',
  borderRadiusLarge: '2px',
  borderRadiusXLarge: '2px',
  fontFamilyBase: "'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
};

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Auth & RBAC providers must always wrap children so hooks like useAuth() work at any point.
  // FluentProvider requires DOM, so it only renders after mount.
  const content = (
    <QueryProvider>
      <AuthProvider>
        <RBACProvider>
          {children}
        </RBACProvider>
      </AuthProvider>
    </QueryProvider>
  );

  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{content}</div>;
  }

  return (
    <FluentProvider theme={edminTheme} style={{ backgroundColor: 'transparent' }}>
      {content}
    </FluentProvider>
  );
}
