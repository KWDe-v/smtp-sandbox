import { Request, Response, NextFunction } from 'express';
import { webhookService } from '../services/webhook.service.js';
import { z } from 'zod';

const createWebhookSchema = z.object({
  url: z.string().url('URL do webhook inválida'),
  events: z.array(z.string()).min(1, 'Selecione ao menos um evento'),
  secret: z.string().optional(),
});

const updateWebhookSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(z.string()).optional(),
  active: z.boolean().optional(),
});

export class WebhookController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const webhooks = await webhookService.listUserWebhooks(req.user!.userId);
      res.status(200).json({ success: true, data: webhooks });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createWebhookSchema.parse(req.body);
      const webhook = await webhookService.createWebhook(req.user!.userId, validated);
      res.status(201).json({
        success: true,
        message: 'Webhook cadastrado com sucesso',
        data: webhook,
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const validated = updateWebhookSchema.parse(req.body);
      const webhook = await webhookService.updateWebhook(id, req.user!.userId, validated);
      res.status(200).json({
        success: true,
        message: 'Webhook atualizado com sucesso',
        data: webhook,
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      await webhookService.deleteWebhook(id, req.user!.userId);
      res.status(200).json({ success: true, message: 'Webhook excluído com sucesso' });
    } catch (err) {
      next(err);
    }
  }
}

export const webhookController = new WebhookController();
