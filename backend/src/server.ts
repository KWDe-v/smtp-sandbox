import { createApp } from './app.js';
import { env } from './config/env.js';
import { testDatabaseConnection, closeDatabaseConnection } from './database/connection.js';
import { testRedisConnection, closeRedisConnections } from './database/redis.js';
import { runMigrations } from './database/migrator.js';

async function bootstrap() {
  console.log('====================================================');
  console.log('🚀 Iniciando Plataforma SMTP Sandbox - Backend API');
  console.log(`🌍 Ambiente: ${env.NODE_ENV}`);
  console.log(`🔌 Porta: ${env.PORT}`);
  console.log('====================================================');

  // Teste de Conexão com o MySQL
  console.log('[Bootstrap] Testando conexão com MySQL...');
  const dbConnected = await testDatabaseConnection();
  if (dbConnected) {
    console.log('✅ MySQL conectado com sucesso.');
    try {
      console.log('[Bootstrap] Executando migrações do banco de dados...');
      await runMigrations();
      console.log('✅ Migrações concluídas.');
    } catch (migErr) {
      console.error('❌ Falha ao rodar migrações:', migErr);
    }
  } else {
    console.warn('⚠️ Não foi possível conectar ao MySQL no momento. Tentará novamente sob demanda.');
  }

  // Teste de Conexão com Redis
  console.log('[Bootstrap] Testando conexão com Redis...');
  const redisConnected = await testRedisConnection();
  if (redisConnected) {
    console.log('✅ Redis conectado com sucesso.');
  } else {
    console.warn('⚠️ Não foi possível conectar ao Redis no momento. Tentará novamente sob demanda.');
  }

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`📡 Servidor HTTP rodando em: http://localhost:${env.PORT}`);
    console.log(`📚 Documentação Swagger em: http://localhost:${env.PORT}/api/docs`);
    console.log(`❤️  Health Check em: http://localhost:${env.PORT}/api/health`);
  });

  // Graceful Shutdown
  const handleShutdown = async (signal: string) => {
    console.log(`\n🛑 Sinal ${signal} recebido. Encerrando conexões graciosamente...`);
    server.close(async () => {
      await closeDatabaseConnection();
      await closeRedisConnections();
      console.log('👋 Backend finalizado com sucesso.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('❌ Erro fatal durante a inicialização:', err);
  process.exit(1);
});
