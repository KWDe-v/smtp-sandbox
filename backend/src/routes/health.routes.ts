import { Router, Request, Response } from 'express';
import { testDatabaseConnection } from '../database/connection.js';
import { testRedisConnection } from '../database/redis.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const dbConnected = await testDatabaseConnection();
  const redisConnected = await testRedisConnection();

  const isHealthy = dbConnected; // Redis pode ser opcional ou obrigatório conforme o modo

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    timestamp: new Date().toISOString(),
    status: isHealthy ? 'healthy' : 'degraded',
    services: {
      mysql: dbConnected ? 'connected' : 'disconnected',
      redis: redisConnected ? 'connected' : 'disconnected',
    },
  });
});

export default router;
