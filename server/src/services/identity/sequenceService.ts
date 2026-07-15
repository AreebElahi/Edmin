/**
 * SequenceService
 * 
 * Provides collision-safe, auto-incrementing sequences per key using
 * PostgreSQL-level atomic upsert within Prisma transactions.
 * 
 * Keys follow the pattern:
 *   STUDENT-{DEPT}-{YEAR}   e.g. "STUDENT-SE-2026"
 *   FACULTY-{DEPT}           e.g. "FACULTY-CS"
 *   STAFF-{DEPT}             e.g. "STAFF-MT"
 *   HR                       e.g. "HR"
 *   ADMIN                    e.g. "ADMIN"
 */

import prisma from '../../config/prisma.js';

/**
 * Atomically reserve the next sequence number for a given key.
 * Uses a serializable transaction to prevent concurrent collisions.
 * 
 * @param key - The sequence namespace key
 * @param tx  - Optional Prisma transaction context (pass when inside an existing tx)
 * @returns The reserved sequence number (1-based)
 */
export async function nextSequence(key: string, tx?: any): Promise<number> {
  const client = tx ?? prisma;

  // Upsert: if key doesn't exist, create with nextval=2 and return 1.
  // If it exists, increment nextval and return old nextval.
  // We achieve atomicity by using Prisma's $transaction with a raw UPDATE + INSERT ON CONFLICT.
  const result = (await client.$queryRawUnsafe(`
    INSERT INTO identifiersequence (key, nextval, updatedat)
    VALUES ($1, 2, NOW())
    ON CONFLICT (key)
    DO UPDATE SET
      nextval   = identifiersequence.nextval + 1,
      updatedat = NOW()
    RETURNING nextval - 1 AS nextval
  `, key)) as { nextval: number }[];

  return result[0].nextval;
}

/**
 * Peek at the next value without consuming it (for preview only).
 */
export async function peekSequence(key: string): Promise<number> {
  const row = await prisma.identifiersequence.findUnique({ where: { key } });
  return row?.nextval ?? 1;
}
