import { Redis } from 'ioredis';
import { env } from '../config/env.js';

let redisClient: Redis | null = null;
let redisPubClient: Redis | null = null;
let redisSubClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 200, 2000);
        return delay;
      },
    });

    redisClient.on('error', (err) => {
      console.error('[Redis Client] Erro de conexão:', err.message);
    });
  }
  return redisClient;
}

export function getRedisPublisher(): Redis {
  if (!redisPubClient) {
    redisPubClient = new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });

    redisPubClient.on('error', (err) => {
      console.error('[Redis Publisher] Erro:', err.message);
    });
  }
  return redisPubClient;
}

export function getRedisSubscriber(): Redis {
  if (!redisSubClient) {
    redisSubClient = new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });

    redisSubClient.on('error', (err) => {
      console.error('[Redis Subscriber] Erro:', err.message);
    });
  }
  return redisSubClient;
}

export async function testRedisConnection(): Promise<boolean> {
  try {
    const client = getRedisClient();
    if (client.status !== 'ready' && client.status !== 'connecting') {
      await client.connect();
    }
    const pong = await client.ping();
    return pong === 'PONG';
  } catch (error) {
    console.error('Erro ao conectar no Redis:', error);
    return false;
  }
}

export async function closeRedisConnections(): Promise<void> {
  if (redisClient) {
    await redisClient.quit().catch(() => {});
    redisClient = null;
  }
  if (redisPubClient) {
    await redisPubClient.quit().catch(() => {});
    redisPubClient = null;
  }
  if (redisSubClient) {
    await redisSubClient.quit().catch(() => {});
    redisSubClient = null;
  }
}
