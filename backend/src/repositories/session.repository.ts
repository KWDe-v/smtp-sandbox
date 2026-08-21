import { query, execute } from '../database/connection.js';
import { Session } from '../types/index.js';
import type { RowDataPacket } from 'mysql2/promise';

interface SessionRow extends RowDataPacket, Session {}

export class SessionRepository {
  async createSession(userId: number, refreshTokenHash: string, expiresAt: Date): Promise<Session> {
    const result = await execute(
      'INSERT INTO sessions (user_id, refresh_token_hash, expires_at) VALUES (?, ?, ?)',
      [userId, refreshTokenHash, expiresAt]
    );

    const rows = await query<SessionRow[]>(
      'SELECT id, user_id, refresh_token_hash, expires_at, created_at FROM sessions WHERE id = ?',
      [result.insertId]
    );
    return rows[0];
  }

  async findByTokenHash(refreshTokenHash: string): Promise<Session | null> {
    const rows = await query<SessionRow[]>(
      'SELECT id, user_id, refresh_token_hash, expires_at, created_at FROM sessions WHERE refresh_token_hash = ? AND expires_at > NOW() LIMIT 1',
      [refreshTokenHash]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async deleteSession(refreshTokenHash: string): Promise<void> {
    await execute('DELETE FROM sessions WHERE refresh_token_hash = ?', [refreshTokenHash]);
  }

  async deleteUserSessions(userId: number): Promise<void> {
    await execute('DELETE FROM sessions WHERE user_id = ?', [userId]);
  }

  async cleanExpiredSessions(): Promise<number> {
    const result = await execute('DELETE FROM sessions WHERE expires_at <= NOW()');
    return result.affectedRows;
  }
}

export const sessionRepository = new SessionRepository();
