import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';
import { createApp } from '../app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Fase 1: Infraestrutura e Configurações Base', () => {
  test('Variáveis de ambiente carregam valores corretos', () => {
    assert.strictEqual(typeof env.PORT, 'number');
    assert.strictEqual(typeof env.MYSQL_HOST, 'string');
    assert.strictEqual(typeof env.REDIS_HOST, 'string');
    assert.strictEqual(typeof env.JWT_SECRET, 'string');
    assert.ok(env.PORT > 0, 'Porta deve ser maior que 0');
  });

  test('Arquivo de migração SQL contém todas as 11 tabelas obrigatórias', () => {
    let migrationPath = path.resolve(__dirname, '../database/migrations/001_initial_schema.sql');
    if (!fs.existsSync(migrationPath)) {
      migrationPath = path.resolve(process.cwd(), 'src/database/migrations/001_initial_schema.sql');
    }
    assert.ok(fs.existsSync(migrationPath), `Arquivo 001_initial_schema.sql deve existir em ${migrationPath}`);

    const sql = fs.readFileSync(migrationPath, 'utf-8');
    const requiredTables = [
      'users',
      'domains',
      'mailboxes',
      'messages',
      'attachments',
      'api_keys',
      'aliases',
      'webhooks',
      'webhook_deliveries',
      'sessions',
      'audit_logs',
    ];

    for (const table of requiredTables) {
      const regex = new RegExp(`CREATE TABLE IF NOT EXISTS \`${table}\``, 'i');
      assert.ok(regex.test(sql), `Tabela "${table}" deve estar presente na migração SQL`);
    }

    assert.ok(sql.includes('utf8mb4'), 'Deve utilizar utf8mb4');
    assert.ok(sql.includes('InnoDB'), 'Deve utilizar InnoDB');
  });

  test('Instância Express do backend inicializa com rotas registradas', () => {
    const app = createApp();
    assert.ok(app, 'Aplicação Express deve ser instanciada');
    assert.strictEqual(typeof app.listen, 'function', 'App deve possuir o método listen');
  });
});
