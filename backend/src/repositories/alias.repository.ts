import { query, execute } from '../database/connection.js';
import { Alias } from '../types/index.js';
import type { RowDataPacket } from 'mysql2/promise';

interface AliasRow extends RowDataPacket, Alias {}

export class AliasRepository {
  async findByDomainId(domainId: number, userId?: number): Promise<Alias[]> {
    let sql = `
      SELECT a.id, a.domain_id, a.alias, a.destination, a.created_at
      FROM aliases a
      JOIN domains d ON d.id = a.domain_id
      WHERE a.domain_id = ?
    `;
    const params: any[] = [domainId];

    if (userId !== undefined) {
      sql += ' AND d.user_id = ?';
      params.push(userId);
    }
    sql += ' ORDER BY a.created_at DESC';

    return query<AliasRow[]>(sql, params);
  }

  async findByUserId(userId: number): Promise<(Alias & { domain: string })[]> {
    const sql = `
      SELECT a.id, a.domain_id, a.alias, a.destination, a.created_at, d.domain
      FROM aliases a
      JOIN domains d ON d.id = a.domain_id
      WHERE d.user_id = ?
      ORDER BY a.created_at DESC
    `;
    const rows = await query<RowDataPacket[]>(sql, [userId]);
    return rows as any;
  }

  async findByAlias(fullAlias: string): Promise<Alias | null> {
    const [aliasPart, domainPart] = fullAlias.split('@');
    if (!aliasPart || !domainPart) return null;

    const sql = `
      SELECT a.id, a.domain_id, a.alias, a.destination, a.created_at
      FROM aliases a
      JOIN domains d ON d.id = a.domain_id
      WHERE LOWER(a.alias) = LOWER(?) AND LOWER(d.domain) = LOWER(?)
      LIMIT 1
    `;
    const rows = await query<AliasRow[]>(sql, [aliasPart, domainPart]);
    return rows.length > 0 ? rows[0] : null;
  }

  async create(data: { domainId: number; alias: string; destination: string }): Promise<Alias> {
    const result = await execute(
      'INSERT INTO aliases (domain_id, alias, destination) VALUES (?, ?, ?)',
      [data.domainId, data.alias.toLowerCase(), data.destination.toLowerCase()]
    );

    const rows = await query<AliasRow[]>('SELECT id, domain_id, alias, destination, created_at FROM aliases WHERE id = ?', [
      result.insertId,
    ]);
    return rows[0];
  }

  async delete(id: number, userId: number): Promise<boolean> {
    const result = await execute(
      `
      DELETE a FROM aliases a
      JOIN domains d ON d.id = a.domain_id
      WHERE a.id = ? AND d.user_id = ?
    `,
      [id, userId]
    );
    return result.affectedRows > 0;
  }
}

export const aliasRepository = new AliasRepository();
