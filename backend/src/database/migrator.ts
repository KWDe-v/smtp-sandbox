import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDatabasePool } from './connection.js';
import type { RowDataPacket } from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function cleanSql(sql: string): string[] {
  // Remove comentários de bloco /* ... */
  const noBlockComments = sql.replace(/\/\*[\s\S]*?\*\//g, '');

  // Remove comentários de linha -- ...
  const lines = noBlockComments
    .split('\n')
    .map((line) => {
      const idx = line.indexOf('--');
      return idx >= 0 ? line.substring(0, idx) : line;
    })
    .join('\n');

  // Divide por ponto e vírgula
  return lines
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export async function runMigrations(): Promise<void> {
  const pool = getDatabasePool();

  console.log('[Migrator] Verificando tabela de controle de migrações...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`_migrations\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`name\` VARCHAR(255) NOT NULL UNIQUE,
      \`executed_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Localiza diretório de migrações
  let migrationsDir = path.resolve(__dirname, 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    migrationsDir = path.resolve(process.cwd(), 'src/database/migrations');
  }
  if (!fs.existsSync(migrationsDir)) {
    migrationsDir = path.resolve(process.cwd(), 'backend/src/database/migrations');
  }

  if (!fs.existsSync(migrationsDir)) {
    console.warn(`[Migrator] Diretório de migrações não encontrado em: ${migrationsDir}`);
    return;
  }

  // Verifica se a tabela users existe
  const [tableCheck] = await pool.query<RowDataPacket[]>(
    "SHOW TABLES LIKE 'users'"
  );
  const tablesMissing = tableCheck.length === 0;

  if (tablesMissing) {
    console.log('[Migrator] Tabelas principais ausentes. Limpando controle de migrações para re-execução...');
    await pool.query('TRUNCATE TABLE `_migrations`');
  }

  const [executedRows] = await pool.query<RowDataPacket[]>('SELECT name FROM `_migrations`');
  const executedNames = new Set(executedRows.map((r) => r.name as string));

  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  console.log(`[Migrator] Encontradas ${files.length} migrações no diretório.`);

  for (const file of files) {
    if (executedNames.has(file)) {
      continue;
    }

    console.log(`[Migrator] Executando migração: ${file}...`);
    const filePath = path.join(migrationsDir, file);
    const sqlContent = fs.readFileSync(filePath, 'utf-8');

    const statements = cleanSql(sqlContent);
    console.log(`[Migrator] ${statements.length} instruções SQL para executar em ${file}.`);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      for (const statement of statements) {
        if (statement.trim()) {
          await connection.query(statement);
        }
      }

      await connection.query('INSERT INTO `_migrations` (name) VALUES (?)', [file]);
      await connection.commit();
      console.log(`[Migrator] Migração ${file} concluída com sucesso.`);
    } catch (error) {
      await connection.rollback();
      console.error(`[Migrator] Falha ao executar migração ${file}:`, error);
      throw error;
    } finally {
      connection.release();
    }
  }

  console.log('[Migrator] Todas as migrações estão atualizadas.');
}

// Se executado diretamente via CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => {
      console.log('[Migrator] Migrações finalizadas com sucesso.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Migrator] Erro fatal durante migrações:', err);
      process.exit(1);
    });
}
