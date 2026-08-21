import { query, execute } from '../database/connection.js';
import { Webhook, WebhookDelivery } from '../types/index.js';
import type { RowDataPacket } from 'mysql2/promise';

interface WebhookRow extends RowDataPacket, Webhook {}

export class WebhookRepository {
  async findByUserId(userId: number): Promise<Webhook[]> {
    const rows = await query<WebhookRow[]>(
      'SELECT id, user_id, url, secret, events, active, created_at, updated_at FROM webhooks WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    return rows.map((r) => ({
      ...r,
      events: typeof r.events === 'string' ? JSON.parse(r.events) : r.events,
    }));
  }

  async findById(id: number, userId?: number): Promise<Webhook | null> {
    let sql = 'SELECT id, user_id, url, secret, events, active, created_at, updated_at FROM webhooks WHERE id = ?';
    const params: any[] = [id];
    if (userId !== undefined) {
      sql += ' AND user_id = ?';
      params.push(userId);
    }
    sql += ' LIMIT 1';

    const rows = await query<WebhookRow[]>(sql, params);
    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      ...row,
      events: typeof row.events === 'string' ? JSON.parse(row.events) : row.events,
    };
  }

  async create(data: { userId: number; url: string; secret: string; events: string[] }): Promise<Webhook> {
    const result = await execute(
      'INSERT INTO webhooks (user_id, url, secret, events, active) VALUES (?, ?, ?, ?, 1)',
      [data.userId, data.url, data.secret, JSON.stringify(data.events)]
    );

    const created = await this.findById(result.insertId);
    if (!created) {
      throw new Error('Falha ao recuperar webhook criado');
    }
    return created;
  }

  async update(id: number, userId: number, data: Partial<Pick<Webhook, 'url' | 'events' | 'active'>>): Promise<Webhook | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.url !== undefined) {
      fields.push('url = ?');
      values.push(data.url);
    }
    if (data.events !== undefined) {
      fields.push('events = ?');
      values.push(JSON.stringify(data.events));
    }
    if (data.active !== undefined) {
      fields.push('active = ?');
      values.push(data.active ? 1 : 0);
    }

    if (fields.length === 0) {
      return this.findById(id, userId);
    }

    values.push(id, userId);
    await execute(`UPDATE webhooks SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`, values);
    return this.findById(id, userId);
  }

  async delete(id: number, userId: number): Promise<boolean> {
    const result = await execute('DELETE FROM webhooks WHERE id = ? AND user_id = ?', [id, userId]);
    return result.affectedRows > 0;
  }

  async logDelivery(data: {
    webhookId: number;
    event: string;
    payload: Record<string, any>;
    statusCode: number | null;
    attempts: number;
  }): Promise<WebhookDelivery> {
    const result = await execute(
      'INSERT INTO webhook_deliveries (webhook_id, event, payload, status_code, attempts) VALUES (?, ?, ?, ?, ?)',
      [data.webhookId, data.event, JSON.stringify(data.payload), data.statusCode, data.attempts]
    );

    const rows = await query<RowDataPacket[]>(
      'SELECT id, webhook_id, event, payload, status_code, attempts, created_at FROM webhook_deliveries WHERE id = ?',
      [result.insertId]
    );
    return rows[0] as any;
  }
}

export const webhookRepository = new WebhookRepository();
