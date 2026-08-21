import { getRedisPublisher, getRedisSubscriber } from '../database/redis.js';
import { Response } from 'express';

export const REDIS_CHANNEL = 'smtp_sandbox_events';

export interface SystemEventPayload {
  event: 'message.received' | 'message.deleted' | 'message.read' | 'mailbox.created' | 'mailbox.deleted';
  timestamp: string;
  userId?: number;
  data: Record<string, any>;
}

class EventManager {
  private sseClients: Map<number, Set<Response>> = new Map();
  private isSubscribed = false;

  async init(): Promise<void> {
    if (this.isSubscribed) return;

    try {
      const subscriber = getRedisSubscriber();
      if (subscriber.status !== 'ready' && subscriber.status !== 'connecting') {
        await subscriber.connect().catch(() => {});
      }

      await subscriber.subscribe(REDIS_CHANNEL);
      this.isSubscribed = true;

      subscriber.on('message', (_channel, messageStr) => {
        try {
          const payload: SystemEventPayload = JSON.parse(messageStr);
          this.broadcastToSse(payload);
        } catch (err) {
          console.error('[EventManager] Erro ao processar mensagem do Redis:', err);
        }
      });

      console.log('✅ [EventManager] Subscrito ao canal Redis Pub/Sub com sucesso.');
    } catch (err) {
      console.warn('⚠️ [EventManager] Redis Pub/Sub indisponível, fallback para eventos em memória:', (err as any).message);
    }
  }

  async publish(payload: SystemEventPayload): Promise<void> {
    try {
      const publisher = getRedisPublisher();
      if (publisher.status !== 'ready' && publisher.status !== 'connecting') {
        await publisher.connect().catch(() => {});
      }
      await publisher.publish(REDIS_CHANNEL, JSON.stringify(payload));
    } catch {
      // Se o Redis falhar, faz fallback local direto
      this.broadcastToSse(payload);
    }
  }

  addSseClient(userId: number, res: Response): void {
    const uid = Number(userId);
    if (!this.sseClients.has(uid)) {
      this.sseClients.set(uid, new Set());
    }
    this.sseClients.get(uid)!.add(res);

    res.on('close', () => {
      const clients = this.sseClients.get(uid);
      if (clients) {
        clients.delete(res);
        if (clients.size === 0) {
          this.sseClients.delete(uid);
        }
      }
    });
  }

  private broadcastToSse(payload: SystemEventPayload): void {
    const sseData = `event: ${payload.event}\ndata: ${JSON.stringify(payload)}\n\n`;

    const targetUserId = payload.userId ? Number(payload.userId) : null;
    if (targetUserId) {
      const userClients = this.sseClients.get(targetUserId);
      if (userClients) {
        for (const res of userClients) {
          try {
            res.write(sseData);
          } catch {}
        }
      }
    } else {
      // Broadcast para todos os clientes conectados
      for (const clients of this.sseClients.values()) {
        for (const res of clients) {
          try {
            res.write(sseData);
          } catch {}
        }
      }
    }
  }
}

export const eventManager = new EventManager();
