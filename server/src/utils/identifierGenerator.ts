/**
 * Identifier Generator
 *
 * Derives institutional identifiers for all user roles, using department
 * codes stored in the database and atomic sequences from SequenceService.
 *
 * Formats:
 *   STUDENT  → {DEPT}-{YEAR}-{SEQ:03}   e.g. SE-2026-001
 *   FACULTY  → FAC-{DEPT}-{SEQ:03}      e.g. FAC-SE-001
 *   STAFF    → {DEPT}-{SEQ:03}          e.g. MT-001
 *   HR       → HR-{SEQ:03}              e.g. HR-001
 *   ADMIN    → ADM-{SEQ:03}             e.g. ADM-001
 */

import { nextSequence, peekSequence } from '../services/identity/sequenceService.js';

export type IdentifierRole = 'STUDENT' | 'FACULTY' | 'STAFF' | 'HR' | 'ADMIN';

function pad(n: number, width = 3): string {
  return String(n).padStart(width, '0');
}

/**
 * Build the sequence key for a role + department + optional year.
 */
export function buildSequenceKey(role: IdentifierRole, deptCode?: string, year?: number): string {
  const dept = (deptCode || 'GEN').toUpperCase();
  switch (role) {
    case 'STUDENT': return `STUDENT-${dept}-${year ?? new Date().getFullYear()}`;
    case 'FACULTY': return `FACULTY-${dept}`;
    case 'STAFF':   return `STAFF-${dept}`;
    case 'HR':      return 'HR';
    case 'ADMIN':   return 'ADMIN';
  }
}

/**
 * Format an identifier string from role, dept, year, and sequence number.
 */
export function formatIdentifier(
  role: IdentifierRole,
  deptCode: string,
  seq: number,
  year?: number
): string {
  const dept = deptCode.toUpperCase();
  const y = year ?? new Date().getFullYear();
  switch (role) {
    case 'STUDENT': return `${dept}-${y}-${pad(seq)}`;
    case 'FACULTY': return `FAC-${dept}-${pad(seq)}`;
    case 'STAFF':   return `${dept}-${pad(seq)}`;
    case 'HR':      return `HR-${pad(seq)}`;
    case 'ADMIN':   return `ADM-${pad(seq)}`;
  }
}

/**
 * Generate and consume a unique identifier.
 * Pass a Prisma transaction context when called inside an existing transaction.
 */
export async function generateIdentifier(
  role: IdentifierRole,
  deptCode: string,
  tx?: any
): Promise<string> {
  const year = new Date().getFullYear();
  const key = buildSequenceKey(role, deptCode, year);
  const seq = await nextSequence(key, tx);
  return formatIdentifier(role, deptCode, seq, year);
}

/**
 * Preview the next identifier without consuming the sequence.
 * Safe to call multiple times (for live preview in the UI).
 */
export async function previewIdentifier(
  role: IdentifierRole,
  deptCode: string
): Promise<string> {
  const year = new Date().getFullYear();
  const key = buildSequenceKey(role, deptCode, year);
  const seq = await peekSequence(key);
  return formatIdentifier(role, deptCode, seq, year);
}
