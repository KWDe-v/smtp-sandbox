import mysql, { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { env } from '../config/env.js';

let pool: Pool | null = null;

export function getDatabasePool(): Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: env.MYSQL_HOST,
      port: env.MYSQL_PORT,
      user: env.MYSQL_USER,
      password: env.MYSQL_PASSWORD,
      database: env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 20,
      queueLimit: 0,
      charset: 'utf8mb4',
      dateStrings: true,
    });
  }
  return pool;
}

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const p = getDatabasePool();
    const [rows] = await p.query('SELECT 1 + 1 AS result');
    return Array.isArray(rows) && rows.length > 0;
  } catch (error) {
    console.error('Erro ao conectar no MySQL:', error);
    return false;
  }
}

export async function query<T extends RowDataPacket[] | ResultSetHeader>(
  sql: string,
  values?: any[]
): Promise<T> {
  const p = getDatabasePool();
  const [result] = await p.query<T>(sql, values);
  return result;
}

export async function execute<T extends ResultSetHeader>(
  sql: string,
  values?: any[]
): Promise<T> {
  const p = getDatabasePool();
  const [result] = await p.execute<T>(sql, values);
  return result;
}

export async function transaction<T>(
  callback: (conn: PoolConnection) => Promise<T>
): Promise<T> {
  const p = getDatabasePool();
  const conn = await p.getConnection();
  try {
    await conn.beginTransaction();
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function closeDatabaseConnection(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
