import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error("FATAL: JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be defined in the environment.");
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  roles: string[];
  version?: number;
}

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, ACCESS_SECRET as string, { expiresIn: '7d' });
}

export function generateRefreshToken(userId: number): string {
  return jwt.sign({ userId }, REFRESH_SECRET as string, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, ACCESS_SECRET as string);
  if (typeof decoded !== 'object' || decoded === null || !('userId' in decoded)) {
    throw new Error("Malformed JWT payload");
  }
  return decoded as JwtPayload;
}

export function verifyRefreshToken(token: string): { userId: number } {
  const decoded = jwt.verify(token, REFRESH_SECRET as string);
  if (typeof decoded !== 'object' || decoded === null || !('userId' in decoded)) {
    throw new Error("Malformed JWT payload");
  }
  return decoded as { userId: number };
}
