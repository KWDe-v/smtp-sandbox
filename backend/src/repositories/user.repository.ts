import { query, execute } from '../database/connection.js';
import { User, UserStatus } from '../types/index.js';
import type { RowDataPacket } from 'mysql2/promise';

interface UserRow extends RowDataPacket, User {}

export class UserRepository {
  async findById(id: number): Promise<User | null> {
    const rows = await query<UserRow[]>(
      'SELECT id, email, password_hash, name, status, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const rows = await query<UserRow[]>(
      'SELECT id, email, password_hash, name, status, created_at, updated_at FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1',
      [email]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async create(user: { email: string; password_hash: string; name: string; status?: UserStatus }): Promise<User> {
    const status = user.status || 'active';
    const result = await execute(
      'INSERT INTO users (email, password_hash, name, status) VALUES (?, ?, ?, ?)',
      [user.email.toLowerCase(), user.password_hash, user.name, status]
    );

    const newUser = await this.findById(result.insertId);
    if (!newUser) {
      throw new Error('Falha ao recuperar o usuário recém-criado');
    }
    return newUser;
  }

  async update(id: number, data: Partial<Pick<User, 'name' | 'password_hash' | 'status'>>): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.password_hash !== undefined) {
      fields.push('password_hash = ?');
      values.push(data.password_hash);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    await execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  async count(): Promise<number> {
    const rows = await query<RowDataPacket[]>('SELECT COUNT(*) as total FROM users');
    return rows[0]?.total || 0;
  }
}

export const userRepository = new UserRepository();
