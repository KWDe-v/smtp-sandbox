import { Request, Response, NextFunction } from 'express';
import { execute } from '../database/connection.js';

export function auditLogger(actionName: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user?.userId || null;
        const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || req.ip || null;
        const userAgent = req.headers['user-agent'] || null;
        const metadata = {
          params: req.params,
          query: req.query,
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
        };

        void execute(
          'INSERT INTO audit_logs (user_id, action, ip_address, user_agent, metadata) VALUES (?, ?, ?, ?, ?)',
          [userId, actionName, ip, userAgent, JSON.stringify(metadata)]
        ).catch((err) => {
          console.warn('[AuditLogger] Falha ao registrar log de auditoria:', err.message);
        });
      }
    });

    next();
  };
}
