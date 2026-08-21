import { query, execute } from '../database/connection.js';
import { Domain } from '../types/index.js';
import type { RowDataPacket } from 'mysql2/promise';

interface DomainRow extends RowDataPacket, Domain {}

export class DomainRepository {
  async findById(id: number, userId?: number): Promise<Domain | null> {
    let sql = 'SELECT id, user_id, domain, verified, verification_token, created_at, updated_at FROM domains WHERE id = ?';
    const params: any[] = [id];

    if (userId !== undefined) {
      sql += ' AND user_id = ?';
      params.push(userId);
    }
    sql += ' LIMIT 1';

    const rows = await query<DomainRow[]>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  async findByDomain(domain: string): Promise<Domain | null> {
    const rows = await query<DomainRow[]>(
      'SELECT id, user_id, domain, verified, verification_token, created_at, updated_at FROM domains WHERE LOWER(domain) = LOWER(?) LIMIT 1',
      [domain]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async findByUserId(userId: number): Promise<Domain[]> {
    return query<DomainRow[]>(
      'SELECT id, user_id, domain, verified, verification_token, created_at, updated_at FROM domains WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
  }

  async create(data: { userId: number; domain: string; verificationToken: string; verified?: boolean }): Promise<Domain> {
    const verified = data.verified ? 1 : 0;
    const result = await execute(
      'INSERT INTO domains (user_id, domain, verification_token, verified) VALUES (?, ?, ?, ?)',
      [data.userId, data.domain.toLowerCase(), data.verificationToken, verified]
    );

    const created = await this.findById(result.insertId);
    if (!created) {
      throw new Error('Falha ao recuperar domínio criado');
    }
    return created;
  }

  async delete(id: number, userId: number): Promise<boolean> {
    const result = await execute('DELETE FROM domains WHERE id = ? AND user_id = ?', [id, userId]);
    return result.affectedRows > 0;
  }

  async verify(id: number): Promise<boolean> {
    const result = await execute('UPDATE domains SET verified = 1 WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

export const domainRepository = new DomainRepository();
