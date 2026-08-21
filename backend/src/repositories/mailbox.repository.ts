import { query, execute } from '../database/connection.js';
import { Mailbox } from '../types/index.js';
import type { RowDataPacket } from 'mysql2/promise';

interface MailboxRow extends RowDataPacket, Mailbox {}

export class MailboxRepository {
  async findById(id: number, userId?: number): Promise<Mailbox | null> {
    let sql = `
      SELECT m.id, m.domain_id, m.email, m.password_hash, m.quota, m.status, m.created_at, m.updated_at
      FROM mailboxes m
      JOIN domains d ON d.id = m.domain_id
      WHERE m.id = ?
    `;
    const params: any[] = [id];

    if (userId !== undefined) {
      sql += ' AND d.user_id = ?';
      params.push(userId);
    }
    sql += ' LIMIT 1';

    const rows = await query<MailboxRow[]>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  async findByEmail(email: string): Promise<Mailbox | null> {
    const rows = await query<MailboxRow[]>(
      'SELECT id, domain_id, email, password_hash, quota, status, created_at, updated_at FROM mailboxes WHERE LOWER(email) = LOWER(?) LIMIT 1',
      [email]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async findByUserId(userId: number): Promise<(Mailbox & { domain: string; messages_count: number; unread_count: number })[]> {
    const sql = `
      SELECT 
        m.id, m.domain_id, m.email, m.password_hash, m.quota, m.status, m.created_at, m.updated_at,
        d.domain,
        (SELECT COUNT(*) FROM messages msg WHERE msg.mailbox_id = m.id) AS messages_count,
        (SELECT COUNT(*) FROM messages msg WHERE msg.mailbox_id = m.id AND msg.is_read = 0) AS unread_count
      FROM mailboxes m
      JOIN domains d ON d.id = m.domain_id
      WHERE d.user_id = ?
      ORDER BY m.created_at DESC
    `;
    const rows = await query<RowDataPacket[]>(sql, [userId]);
    return rows as any;
  }

  async findByDomainId(domainId: number, userId?: number): Promise<Mailbox[]> {
    let sql = `
      SELECT m.id, m.domain_id, m.email, m.password_hash, m.quota, m.status, m.created_at, m.updated_at
      FROM mailboxes m
      JOIN domains d ON d.id = m.domain_id
      WHERE m.domain_id = ?
    `;
    const params: any[] = [domainId];

    if (userId !== undefined) {
      sql += ' AND d.user_id = ?';
      params.push(userId);
    }
    sql += ' ORDER BY m.created_at DESC';

    return query<MailboxRow[]>(sql, params);
  }

  async create(data: { domainId: number; email: string; passwordHash?: string; quota?: number }): Promise<Mailbox> {
    const quota = data.quota || 104857600; // 100MB
    const result = await execute(
      'INSERT INTO mailboxes (domain_id, email, password_hash, quota, status) VALUES (?, ?, ?, ?, ?)',
      [data.domainId, data.email.toLowerCase(), data.passwordHash || null, quota, 'active']
    );

    const created = await this.findById(result.insertId);
    if (!created) {
      throw new Error('Falha ao recuperar a caixa postal criada');
    }
    return created;
  }

  async delete(id: number, userId: number): Promise<boolean> {
    const result = await execute(
      `
      DELETE m FROM mailboxes m
      JOIN domains d ON d.id = m.domain_id
      WHERE m.id = ? AND d.user_id = ?
    `,
      [id, userId]
    );
    return result.affectedRows > 0;
  }
}

export const mailboxRepository = new MailboxRepository();
