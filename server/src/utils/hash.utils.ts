import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export async function hashData(data: string): Promise<string> {
  return bcrypt.hash(data, SALT_ROUNDS);
}

export async function verifyData(data: string, hash: string): Promise<boolean> {
  return bcrypt.compare(data, hash);
}
