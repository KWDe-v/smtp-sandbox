import { query, execute } from '../database/connection.js';
import { Message } from '../types/index.js';
import type { RowDataPacket } from 'mysql2/promise';

interface MessageRow extends RowDataPacket, Message {}

export class MessageRepository {
  async findById(id: number, userId?: number): Promise<Message | null> {
    let sql = `
      SELECT msg.id, msg.mailbox_id, msg.message_id, msg.sender, msg.recipient, 
             msg.subject, msg.text_body, msg.html_body, msg.raw_message, msg.headers, 
             msg.mime_type, msg.size, msg.is_read, msg.created_at, msg.expires_at
      FROM messages msg
      JOIN mailboxes m ON m.id = msg.mailbox_id
      JOIN domains d ON d.id = m.domain_id
      WHERE msg.id = ?
    `;
    const params: any[] = [id];

    if (userId !== undefined) {
      sql += ' AND d.user_id = ?';
      params.push(userId);
    }
    sql += ' LIMIT 1';

    const rows = await query<MessageRow[]>(sql, params);
    if (rows.length === 0) return null;

    const msg = rows[0];
    if (typeof msg.headers === 'string') {
      try {
        msg.headers = JSON.parse(msg.headers);
      } catch {
        // keep as is
      }
    }
    return msg;
  }

  async findByMailboxId(
    mailboxId: number,
    userId?: number,
    limit = 50,
    offset = 0
  ): Promise<{ messages: Message[]; total: number }> {
    let countSql = `
      SELECT COUNT(*) as total
      FROM messages msg
      JOIN mailboxes m ON m.id = msg.mailbox_id
      JOIN domains d ON d.id = m.domain_id
      WHERE msg.mailbox_id = ?
    `;
    const countParams: any[] = [mailboxId];

    if (userId !== undefined) {
      countSql += ' AND d.user_id = ?';
      countParams.push(userId);
    }

    const countRows = await query<RowDataPacket[]>(countSql, countParams);
    const total = countRows[0]?.total || 0;

    let sql = `
      SELECT msg.id, msg.mailbox_id, msg.message_id, msg.sender, msg.recipient, 
             msg.subject, msg.mime_type, msg.size, msg.is_read, msg.created_at, msg.expires_at,
             (SELECT COUNT(*) FROM attachments a WHERE a.message_id = msg.id) as attachments_count
      FROM messages msg
      JOIN mailboxes m ON m.id = msg.mailbox_id
      JOIN domains d ON d.id = m.domain_id
      WHERE msg.mailbox_id = ?
    `;
    const params: any[] = [mailboxId];

    if (userId !== undefined) {
      sql += ' AND d.user_id = ?';
      params.push(userId);
    }

    sql += ' ORDER BY msg.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = await query<RowDataPacket[]>(sql, params);
    return {
      messages: rows as any,
      total,
    };
  }

  async findRecentByUserId(userId: number, limit = 10): Promise<Message[]> {
    const sql = `
      SELECT msg.id, msg.mailbox_id, msg.message_id, msg.sender, msg.recipient, 
             msg.subject, msg.mime_type, msg.size, msg.is_read, msg.created_at,
             m.email as mailbox_email
      FROM messages msg
      JOIN mailboxes m ON m.id = msg.mailbox_id
      JOIN domains d ON d.id = m.domain_id
      WHERE d.user_id = ?
      ORDER BY msg.created_at DESC
      LIMIT ?
    `;
    return query<RowDataPacket[]>(sql, [userId, limit]) as any;
  }

  async search(
    userId: number,
    filters: {
      email?: string;
      sender?: string;
      subject?: string;
      search?: string;
      unreadOnly?: boolean;
    },
    limit = 20,
    offset = 0
  ): Promise<{ messages: Message[]; total: number }> {
    let whereClauses = ['d.user_id = ?'];
    const params: any[] = [userId];

    if (filters.email) {
      whereClauses.push('(m.email = ? OR msg.recipient LIKE ?)');
      params.push(filters.email.toLowerCase().trim(), `%${filters.email.toLowerCase().trim()}%`);
    }

    if (filters.sender) {
      whereClauses.push('msg.sender LIKE ?');
      params.push(`%${filters.sender.trim()}%`);
    }

    if (filters.subject) {
      whereClauses.push('msg.subject LIKE ?');
      params.push(`%${filters.subject.trim()}%`);
    }

    if (filters.search) {
      whereClauses.push('(msg.subject LIKE ? OR msg.sender LIKE ? OR msg.text_body LIKE ? OR m.email LIKE ?)');
      const term = `%${filters.search.trim()}%`;
      params.push(term, term, term, term);
    }

    if (filters.unreadOnly) {
      whereClauses.push('msg.is_read = 0');
    }

    const whereSql = whereClauses.join(' AND ');

    const countSql = `
      SELECT COUNT(*) as total
      FROM messages msg
      JOIN mailboxes m ON m.id = msg.mailbox_id
      JOIN domains d ON d.id = m.domain_id
      WHERE ${whereSql}
    `;
    const countRows = await query<RowDataPacket[]>(countSql, params);
    const total = countRows[0]?.total || 0;

    const dataSql = `
      SELECT msg.id, msg.mailbox_id, msg.message_id, msg.sender, msg.recipient, 
             msg.subject, msg.text_body, msg.mime_type, msg.size, msg.is_read, msg.created_at,
             m.email as mailbox_email,
             (SELECT COUNT(*) FROM attachments a WHERE a.message_id = msg.id) as attachments_count
      FROM messages msg
      JOIN mailboxes m ON m.id = msg.mailbox_id
      JOIN domains d ON d.id = m.domain_id
      WHERE ${whereSql}
      ORDER BY msg.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...params, limit, offset];
    const rows = await query<RowDataPacket[]>(dataSql, dataParams);

    return {
      messages: rows as any,
      total,
    };
  }

  async create(data: {
    mailboxId: number;
    messageId: string | null;
    sender: string;
    recipient: string;
    subject: string | null;
    textBody: string | null;
    htmlBody: string | null;
    rawMessage: string | null;
    headers: Record<string, any> | null;
    mimeType: string;
    size: number;
    expiresAt?: Date | null;
  }): Promise<Message> {
    const headersJson = data.headers ? JSON.stringify(data.headers) : null;
    const result = await execute(
      `INSERT INTO messages 
        (mailbox_id, message_id, sender, recipient, subject, text_body, html_body, raw_message, headers, mime_type, size, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.mailboxId,
        data.messageId,
        data.sender,
        data.recipient,
        data.subject,
        data.textBody,
        data.htmlBody,
        data.rawMessage,
        headersJson,
        data.mimeType,
        data.size,
        data.expiresAt || null,
      ]
    );

    const created = await this.findById(result.insertId);
    if (!created) {
      throw new Error('Falha ao recuperar mensagem recém-criada');
    }
    return created;
  }

  async markAsRead(id: number, userId?: number): Promise<boolean> {
    let sql = `
      UPDATE messages msg
      JOIN mailboxes m ON m.id = msg.mailbox_id
      JOIN domains d ON d.id = m.domain_id
      SET msg.is_read = 1
      WHERE msg.id = ?
    `;
    const params: any[] = [id];
    if (userId !== undefined) {
      sql += ' AND d.user_id = ?';
      params.push(userId);
    }
    const result = await execute(sql, params);
    return result.affectedRows > 0;
  }

  async markAsUnread(id: number, userId?: number): Promise<boolean> {
    let sql = `
      UPDATE messages msg
      JOIN mailboxes m ON m.id = msg.mailbox_id
      JOIN domains d ON d.id = m.domain_id
      SET msg.is_read = 0
      WHERE msg.id = ?
    `;
    const params: any[] = [id];
    if (userId !== undefined) {
      sql += ' AND d.user_id = ?';
      params.push(userId);
    }
    const result = await execute(sql, params);
    return result.affectedRows > 0;
  }

  async delete(id: number, userId?: number): Promise<boolean> {
    let sql = `
      DELETE msg FROM messages msg
      JOIN mailboxes m ON m.id = msg.mailbox_id
      JOIN domains d ON d.id = m.domain_id
      WHERE msg.id = ?
    `;
    const params: any[] = [id];
    if (userId !== undefined) {
      sql += ' AND d.user_id = ?';
      params.push(userId);
    }
    const result = await execute(sql, params);
    return result.affectedRows > 0;
  }

  async countTotalAndUnreadByUserId(userId: number): Promise<{ total: number; unread: number }> {
    const sql = `
      SELECT 
        COUNT(msg.id) as total,
        COUNT(CASE WHEN msg.is_read = 0 THEN 1 END) as unread
      FROM messages msg
      JOIN mailboxes m ON m.id = msg.mailbox_id
      JOIN domains d ON d.id = m.domain_id
      WHERE d.user_id = ?
    `;
    const rows = await query<RowDataPacket[]>(sql, [userId]);
    return {
      total: rows[0]?.total || 0,
      unread: rows[0]?.unread || 0,
    };
  }
}

export const messageRepository = new MessageRepository();
