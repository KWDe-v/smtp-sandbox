import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../database/redis.js';
import { env } from '../config/env.js';

const memoryStore = new Map<string, { count: number; resetAt: number }>();

export function rateLimiter(
  maxRequests = env.RATE_LIMIT_MAX_REQUESTS,
  windowMs = env.RATE_LIMIT_WINDOW_MS
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = `rl:${req.ip || req.socket.remoteAddress || 'unknown'}:${req.baseUrl || ''}`;

    try {
      const redis = getRedisClient();
      if (redis.status === 'ready') {
        const count = await redis.incr(key);
        if (count === 1) {
          await redis.pexpire(key, windowMs);
        }

        if (count > maxRequests) {
          const ttl = await redis.pttl(key);
          res.setHeader('Retry-After', Math.ceil(ttl / 1000));
          res.status(429).json({
            success: false,
            error: 'Muitas requisições. Por favor, tente novamente em alguns instantes.',
          });
          return;
        }

        next();
        return;
      }
    } catch {
      // Fallback para memória se Redis estiver temporariamente offline
    }

    // Fallback de memória
    const now = Date.now();
    const current = memoryStore.get(key);

    if (!current || now > current.resetAt) {
      memoryStore.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    current.count++;
    if (current.count > maxRequests) {
      res.setHeader('Retry-After', Math.ceil((current.resetAt - now) / 1000));
      res.status(429).json({
        success: false,
        error: 'Muitas requisições. Por favor, tente novamente em alguns instantes.',
      });
      return;
    }

    next();
  };
}
