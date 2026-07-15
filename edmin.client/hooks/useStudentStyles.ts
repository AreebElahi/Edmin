'use client';

import { makeStyles, tokens, shorthands } from '@fluentui/react-components';

export const useStudentStyles = makeStyles({
  container: {
    maxWidth: '1200px',
    ...shorthands.margin('0', 'auto'),
    padding: '32px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    borderRadius: tokens.borderRadiusMedium,
    width: 'fit-content',
  },
  breadcrumbLink: {
    color: tokens.colorNeutralForeground2,
    textDecorationLine: 'none',
    display: 'flex',
    alignItems: 'center',
    ':hover': {
      color: tokens.colorBrandForegroundLinkHover,
    }
  },
  breadcrumbSeparator: {
    color: tokens.colorNeutralStroke1,
  },
  breadcrumbActive: {
    color: tokens.colorNeutralForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
  headerCard: {
    position: 'relative',
    backgroundColor: tokens.colorNeutralBackground1,
    padding: '24px',
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow2,
    overflowX: 'hidden',
    overflowY: 'hidden',
  },
  headerStrip: {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '4px',
    backgroundImage: `linear-gradient(to right, ${tokens.colorBrandBackground}, ${tokens.colorBrandBackgroundHover})`,
  },
  kpiContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  kpiCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    padding: '20px',
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow2,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '120px',
  },
  kpiHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiTitle: {
    color: tokens.colorNeutralForeground2,
    fontWeight: tokens.fontWeightMedium,
  },
  kpiIcon: {
    fontSize: '24px',
    color: tokens.colorBrandForeground1,
    padding: '8px',
    backgroundColor: tokens.colorBrandBackground2,
    borderRadius: tokens.borderRadiusMedium,
  },
  kpiValue: {
    fontSize: '28px',
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    ...shorthands.margin('12px', '0', '4px'),
  },
  kpiSubtext: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh',
    flexDirection: 'column',
    gap: '12px',
  },
  errorContainer: {
    padding: '24px',
    maxWidth: '1200px',
    ...shorthands.margin('0', 'auto'),
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px',
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    borderRadius: tokens.borderRadiusMedium,
    color: tokens.colorNeutralForeground3,
  },
});
