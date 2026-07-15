/**
 * Email Generation Utility
 * 
 * Derives a unique institutional email address from a user's full name
 * using the configured domain. Attempts multiple candidate patterns
 * and picks the first one not already in the system.
 */

import prisma from '../config/prisma.js';

const EMAIL_DOMAIN = process.env.EMAIL_DOMAIN || 'edmin.edu.pk';

/**
 * Sanitize a name part: lowercase, remove non-alpha-numeric, trim.
 */
function sanitize(part: string): string {
  return part.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Generate an ordered list of candidate emails from a full name.
 *
 * Priority order:
 *   1. firstname.lastname          → john.doe@edmin.edu.pk
 *   2. firstnamelastname           → johndoe@edmin.edu.pk
 *   3. firstname.lastinitial       → john.d@edmin.edu.pk
 *   4. firstinitial.lastname       → j.doe@edmin.edu.pk
 *   5. firstname.lastname1         → john.doe1@edmin.edu.pk
 *   6. firstname.lastname2         → john.doe2@edmin.edu.pk
 *   ...
 *   N. firstname.lastnameN         (keeps incrementing until unique)
 */
function buildCandidates(fullName: string): string[] {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const first = sanitize(parts[0] || 'user');
  const last = sanitize(parts[parts.length - 1] || '');
  const firstInitial = first.charAt(0);
  const lastInitial = last.charAt(0);

  const base: string[] = [];

  if (last && last !== first) {
    base.push(`${first}.${last}`);          // john.doe
    base.push(`${first}${last}`);           // johndoe
    base.push(`${first}.${lastInitial}`);   // john.d
    base.push(`${firstInitial}.${last}`);   // j.doe
  } else {
    base.push(first);                        // john (single name)
    base.push(`${first}1`);
  }

  // Numeric suffixes on the primary pattern
  const primary = base[0];
  for (let i = 1; i <= 99; i++) {
    base.push(`${primary}${i}`);            // john.doe1, john.doe2 ...
  }

  return base.map(local => `${local}@${EMAIL_DOMAIN}`);
}

/**
 * Find a unique email not already used in the `user` table.
 * Throws if no suitable candidate can be found (practically impossible).
 */
export async function generateUniqueEmail(fullName: string): Promise<string> {
  const candidates = buildCandidates(fullName);

  // Bulk-check all base candidates in a single query to minimise round trips
  const taken = await prisma.user.findMany({
    where: { email: { in: candidates } },
    select: { email: true }
  });

  const takenSet = new Set(taken.map((u: { email: string }) => u.email));

  for (const candidate of candidates) {
    if (!takenSet.has(candidate)) {
      return candidate;
    }
  }

  // Fallback: timestamp-based guaranteed unique email
  const ts = Date.now().toString(36);
  const first = sanitize(fullName.split(' ')[0] || 'user');
  return `${first}.${ts}@${EMAIL_DOMAIN}`;
}
