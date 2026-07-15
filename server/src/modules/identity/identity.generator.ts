import prisma from '../../config/prisma.js';
import { nextSequence, peekSequence } from '../../services/identity/sequenceService.js';
import { EMAIL_DOMAIN, DEFAULT_DEPARTMENT_CODE } from './identity.constants.js';


function pad(n: number, width = 3): string {
  return String(n).padStart(width, '0');
}

/**
 * Normalize a full name to a unique, clean username format:
 * e.g., "Muneeb Ur Rehman" -> "muneeb.ur.rehman"
 */
export function normalizeNameForUsername(fullName: string): string {
  return fullName
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s]/g, '')     // remove non-alphanumeric except spaces
    .replace(/\s+/g, '.')            // replace spaces with dots
    .replace(/\.+/g, '.')            // remove consecutive dots
    .slice(0, 50);                   // max 50 chars
}

/**
 * Generate a unique username, checking the database for availability.
 */
export async function generateUsername(fullName: string, tx?: any): Promise<string> {
  const base = normalizeNameForUsername(fullName);
  let candidate = base;
  let counter = 1;
  const client = tx || prisma;

  while (true) {
    const existing = await client.user.findUnique({
      where: { username: candidate }
    });
    if (!existing) {
      return candidate;
    }
    // If taken, append suffix
    const suffix = String(counter);
    candidate = `${base.slice(0, 50 - suffix.length)}${suffix}`;
    counter++;
  }
}

/**
 * Generate unique institutional email.
 */
export function generateInstitutionalEmail(username: string): string {
  return `${username}@${EMAIL_DOMAIN}`;
}

/**
 * Build the sequence key for a role + department + optional year.
 */
export function buildSequenceKey(role: string, deptCode?: string, year?: number): string {
  const dept = (deptCode || DEFAULT_DEPARTMENT_CODE).toUpperCase();
  switch (role) {
    case 'STUDENT': return `STUDENT-${dept}-${year ?? new Date().getFullYear()}`;
    case 'FACULTY': return `FACULTY-${dept}`;
    case 'STAFF':   return `STAFF-${dept}`;
    case 'HR':      return 'HR';
    case 'ADMIN':   return 'ADMIN';
    default:        return `STAFF-${dept}`;
  }
}

/**
 * Format an identifier string.
 */
export function formatIdentifier(
  role: string,
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
    default:        return `${dept}-${pad(seq)}`;
  }
}

/**
 * Generate and consume a unique identifier.
 */
export async function generateIdentifier(
  role: string,
  deptCode: string,
  tx?: any
): Promise<string> {
  const year = new Date().getFullYear();
  const key = buildSequenceKey(role, deptCode, year);
  const seq = await nextSequence(key, tx);
  return formatIdentifier(role, deptCode, seq, year);
}

/**
 * Generate a complete, unique identity object containing username, email, and identifier.
 */
export async function generateIdentity(payload: {
  name: string;
  role: string;
  departmentId?: number;
  tx?: any;
}): Promise<{ username: string; institutionalEmail: string; identifier: string; deptCode: string }> {
  const { name, role, departmentId } = payload;
  const client = payload.tx || prisma;

  // Resolve department code
  let deptCode = DEFAULT_DEPARTMENT_CODE;
  if (departmentId) {
    const dept = await client.department.findUnique({
      where: { departmentid: departmentId }
    });
    if (dept) {
      deptCode = dept.code;
    }
  }

  const username = await generateUsername(name, client);
  const institutionalEmail = generateInstitutionalEmail(username);
  const identifier = await generateIdentifier(role, deptCode, client);

  return {
    username,
    institutionalEmail,
    identifier,
    deptCode
  };
}
