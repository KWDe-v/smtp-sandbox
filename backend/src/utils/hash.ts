import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateRandomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const rawKey = `sk_live_${crypto.randomBytes(24).toString('hex')}`;
  const prefix = rawKey.substring(0, 12);
  const hash = hashToken(rawKey);
  return { key: rawKey, hash, prefix };
}
