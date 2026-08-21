import { Request, Response } from 'express';
import { eventManager } from '../events/event-emitter.js';

export class EventController {
  subscribe(req: Request, res: Response): void {
    const userId = req.user!.userId;

    // Configura headers para Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Para Nginx

    // Envia mensagem inicial de conexão
    res.write(`event: connected\ndata: ${JSON.stringify({ message: 'Conectado ao stream de eventos em tempo real', userId })}\n\n`);

    // Registra cliente no EventManager
    eventManager.addSseClient(userId, res);

    // Heartbeat para manter conexão aberta
    const intervalId = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 25000);

    req.on('close', () => {
      clearInterval(intervalId);
    });
  }
}

export const eventController = new EventController();
