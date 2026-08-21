import { query, execute } from '../database/connection.js';
import { ApiKey } from '../types/index.js';
import { hashToken } from '../utils/hash.js';
import type { RowDataPacket } from 'mysql2/promise';

interface ApiKeyRow extends RowDataPacket, ApiKey {}

export class ApiKeyRepository {
  async findByRawKey(rawKey: string): Promise<ApiKey | null> {
    const cleanKey = rawKey.trim();
    const hash = hashToken(cleanKey);

    // Aceita:
    // 1. O token original (sk_live_...) -> calcula hash SHA-256
    // 2. O hash completo (64 caracteres)
    // 3. O prefixo do hash copiado da tabela
    const rows = await query<ApiKeyRow[]>(
      `SELECT id, user_id, name, key_hash, last_used_at, created_at, expires_at 
       FROM api_keys 
       WHERE key_hash = ? 
          OR key_hash = ? 
          OR key_hash LIKE CONCAT(?, '%')
       LIMIT 1`,
      [hash, cleanKey, cleanKey]
    );

    if (rows.length > 0) {
      const apiKey = rows[0];

      // Checa expiração em Javascript
      if (apiKey.expires_at && new Date(apiKey.expires_at).getTime() < Date.now()) {
        console.warn(`[Auth] API Key ${apiKey.id} está expirada`);
        return null;
      }

      // Atualiza last_used_at de forma assíncrona
      void execute('UPDATE api_keys SET last_used_at = NOW() WHERE id = ?', [apiKey.id]);
      return apiKey;
    }

    console.warn(`[Auth] Nenhuma API Key encontrada para o valor fornecido (tamanho: ${cleanKey.length})`);
    return null;
  }

  async findByUserId(userId: number): Promise<ApiKey[]> {
    return query<ApiKeyRow[]>(
      'SELECT id, user_id, name, key_hash, last_used_at, created_at, expires_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
  }

  async create(data: { userId: number; name: string; keyHash: string; expiresAt?: Date }): Promise<ApiKey> {
    const result = await execute(
      'INSERT INTO api_keys (user_id, name, key_hash, expires_at) VALUES (?, ?, ?, ?)',
      [data.userId, data.name, data.keyHash, data.expiresAt || null]
    );

    const rows = await query<ApiKeyRow[]>(
      'SELECT id, user_id, name, key_hash, last_used_at, created_at, expires_at FROM api_keys WHERE id = ?',
      [result.insertId]
    );
    return rows[0];
  }

  async delete(id: number, userId: number): Promise<boolean> {
    const result = await execute('DELETE FROM api_keys WHERE id = ? AND user_id = ?', [id, userId]);
    return result.affectedRows > 0;
  }
}

export const apiKeyRepository = new ApiKeyRepository();
