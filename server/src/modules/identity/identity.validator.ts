/**
 * Validate that an identifier matches the role and department constraints.
 */
export function validateIdentifier(identifier: string, role: string, deptCode?: string): boolean {
  const cleanId = identifier.trim().toUpperCase();
  const dept = (deptCode || '').trim().toUpperCase();

  switch (role) {
    case 'STUDENT': {
      // Format: {DEPT}-{YEAR}-{SEQ:03}  e.g. SE-2026-001
      const regex = new RegExp(`^${dept || '[A-Z0-9]+'}-\\d{4}-\\d{3}$`);
      return regex.test(cleanId);
    }
    case 'FACULTY': {
      // Format: FAC-{DEPT}-{SEQ:03}  e.g. FAC-SE-001
      const regex = new RegExp(`^FAC-${dept || '[A-Z0-9]+'}-\\d{3}$`);
      return regex.test(cleanId);
    }
    case 'STAFF': {
      // Format: {DEPT}-{SEQ:03}  e.g. MT-001
      const regex = new RegExp(`^${dept || '[A-Z0-9]+'}-\\d{3}$`);
      return regex.test(cleanId);
    }
    case 'HR': {
      // Format: HR-{SEQ:03}  e.g. HR-001
      return /^HR-\d{3}$/.test(cleanId);
    }
    case 'ADMIN': {
      // Format: ADM-{SEQ:03}  e.g. ADM-001
      return /^ADM-\d{3}$/.test(cleanId);
    }
    default:
      return false;
  }
}
