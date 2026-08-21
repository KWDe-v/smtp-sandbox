import dotenv from 'dotenv';
import path from 'path';

// Carrega variáveis do arquivo .env
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config(); // fallback para o diretório atual

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  API_URL: process.env.API_URL || 'http://localhost:4000',

  // MySQL
  MYSQL_HOST: process.env.MYSQL_HOST || '127.0.0.1',
  MYSQL_PORT: parseInt(process.env.MYSQL_PORT || '3306', 10),
  MYSQL_DATABASE: process.env.MYSQL_DATABASE || 'smtp_sandbox',
  MYSQL_USER: process.env.MYSQL_USER || 'sandbox_user',
  MYSQL_PASSWORD: process.env.MYSQL_PASSWORD || 'sandbox_secret_pass',
  MYSQL_ROOT_PASSWORD: process.env.MYSQL_ROOT_PASSWORD || 'root_sandbox_secret',

  // Redis
  REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_jwt_access_key_change_in_production_min_32_bytes',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'super_secret_jwt_refresh_key_change_in_production_min_32_bytes',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Storage
  STORAGE_PATH: process.env.STORAGE_PATH || path.resolve(process.cwd(), '../storage/attachments'),
  MAX_ATTACHMENT_SIZE_MB: parseInt(process.env.MAX_ATTACHMENT_SIZE_MB || '25', 10),
  MAX_MESSAGE_SIZE_MB: parseInt(process.env.MAX_MESSAGE_SIZE_MB || '50', 10),

  // Webhook
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || 'webhook_global_signing_secret_xyz123',

  // Rate limit
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
};
