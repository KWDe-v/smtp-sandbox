import crypto from 'crypto';
import { webhookRepository } from '../repositories/webhook.repository.js';
import { generateRandomToken } from '../utils/hash.js';
import { Webhook } from '../types/index.js';

export class WebhookService {
  async listUserWebhooks(userId: number): Promise<Webhook[]> {
    return webhookRepository.findByUserId(userId);
  }

  async createWebhook(userId: number, data: { url: string; events: string[]; secret?: string }): Promise<Webhook> {
    const secret = data.secret || `whsec_${generateRandomToken(24)}`;
    return webhookRepository.create({
      userId,
      url: data.url,
      secret,
      events: data.events,
    });
  }

  async updateWebhook(id: number, userId: number, data: Partial<Pick<Webhook, 'url' | 'events' | 'active'>>): Promise<Webhook> {
    const updated = await webhookRepository.update(id, userId, data);
    if (!updated) {
      const error = new Error('Webhook não encontrado');
      (error as any).statusCode = 404;
      throw error;
    }
    return updated;
  }

  async deleteWebhook(id: number, userId: number): Promise<void> {
    const deleted = await webhookRepository.delete(id, userId);
    if (!deleted) {
      const error = new Error('Webhook não encontrado ou sem permissão');
      (error as any).statusCode = 404;
      throw error;
    }
  }

  async dispatchEvent(userId: number, event: string, payload: Record<string, any>): Promise<void> {
    const webhooks = await webhookRepository.findByUserId(userId);
    const activeWebhooks = webhooks.filter((wh) => wh.active && wh.events.includes(event));

    for (const webhook of activeWebhooks) {
      // Dispara em background
      void this.deliverWithRetry(webhook, event, payload);
    }
  }

  private async deliverWithRetry(
    webhook: Webhook,
    event: string,
    payload: Record<string, any>,
    maxRetries = 3
  ): Promise<void> {
    const body = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      payload,
    });

    const signature = crypto.createHmac('sha256', webhook.secret).update(body).digest('hex');

    let attempts = 0;
    let statusCode: number | null = null;
    let delivered = false;

    while (attempts < maxRetries && !delivered) {
      attempts++;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Sandbox-Signature': signature,
            'X-Sandbox-Event': event,
            'User-Agent': 'SMTP-Sandbox-Webhook/1.0',
          },
          body,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        statusCode = response.status;

        if (response.ok) {
          delivered = true;
        } else {
          // Aguarda com backoff exponencial antes de tentar novamente (1s, 2s, etc.)
          await new Promise((r) => setTimeout(r, attempts * 1000));
        }
      } catch (err) {
        console.warn(`[Webhook Delivery] Falha na tentativa ${attempts} para ${webhook.url}:`, (err as any).message);
        await new Promise((r) => setTimeout(r, attempts * 1000));
      }
    }

    await webhookRepository.logDelivery({
      webhookId: webhook.id,
      event,
      payload,
      statusCode,
      attempts,
    });
  }
}

export const webhookService = new WebhookService();
