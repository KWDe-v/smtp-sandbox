import { query, execute } from '../database/connection.js';
import { Attachment } from '../types/index.js';
import type { RowDataPacket } from 'mysql2/promise';

interface AttachmentRow extends RowDataPacket, Attachment {}

export class AttachmentRepository {
  async findById(id: number, userId?: number): Promise<Attachment | null> {
    let sql = `
      SELECT a.id, a.message_id, a.filename, a.mime_type, a.size, a.storage_path, a.created_at
      FROM attachments a
      JOIN messages msg ON msg.id = a.message_id
      JOIN mailboxes m ON m.id = msg.mailbox_id
      JOIN domains d ON d.id = m.domain_id
      WHERE a.id = ?
    `;
    const params: any[] = [id];

    if (userId !== undefined) {
      sql += ' AND d.user_id = ?';
      params.push(userId);
    }
    sql += ' LIMIT 1';

    const rows = await query<AttachmentRow[]>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  async findByMessageId(messageId: number, userId?: number): Promise<Attachment[]> {
    let sql = `
      SELECT a.id, a.message_id, a.filename, a.mime_type, a.size, a.storage_path, a.created_at
      FROM attachments a
      JOIN messages msg ON msg.id = a.message_id
      JOIN mailboxes m ON m.id = msg.mailbox_id
      JOIN domains d ON d.id = m.domain_id
      WHERE a.message_id = ?
    `;
    const params: any[] = [messageId];

    if (userId !== undefined) {
      sql += ' AND d.user_id = ?';
      params.push(userId);
    }
    sql += ' ORDER BY a.created_at ASC';

    return query<AttachmentRow[]>(sql, params);
  }

  async create(data: {
    messageId: number;
    filename: string;
    mimeType: string;
    size: number;
    storagePath: string;
  }): Promise<Attachment> {
    const result = await execute(
      'INSERT INTO attachments (message_id, filename, mime_type, size, storage_path) VALUES (?, ?, ?, ?, ?)',
      [data.messageId, data.filename, data.mimeType, data.size, data.storagePath]
    );

    const rows = await query<AttachmentRow[]>(
      'SELECT id, message_id, filename, mime_type, size, storage_path, created_at FROM attachments WHERE id = ?',
      [result.insertId]
    );
    return rows[0];
  }
}

export const attachmentRepository = new AttachmentRepository();
