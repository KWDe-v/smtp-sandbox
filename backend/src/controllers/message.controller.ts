import { Request, Response, NextFunction } from 'express';
import { messageService } from '../services/message.service.js';

export class MessageController {
  async listByMailbox(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const mailboxId = parseInt(req.params.id, 10);
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 50;

      const result = await messageService.listMailboxMessages(mailboxId, req.user!.userId, page, limit);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const email = req.query.email as string | undefined;
      const sender = req.query.sender as string | undefined;
      const subject = req.query.subject as string | undefined;
      const search = req.query.search as string | undefined;
      const unreadOnly = req.query.unreadOnly === 'true' || req.query.unread === 'true';

      const result = await messageService.searchMessages(
        req.user!.userId,
        { email, sender, subject, search, unreadOnly },
        page,
        limit
      );
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getRecent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const recent = await messageService.getRecentMessages(req.user!.userId, limit);
      res.status(200).json({ success: true, data: recent });
    } catch (err) {
      next(err);
    }
  }

  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const message = await messageService.getMessage(id, req.user!.userId);
      res.status(200).json({ success: true, data: message });
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      await messageService.markAsRead(id, req.user!.userId);
      res.status(200).json({ success: true, message: 'Mensagem marcada como lida' });
    } catch (err) {
      next(err);
    }
  }

  async markAsUnread(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      await messageService.markAsUnread(id, req.user!.userId);
      res.status(200).json({ success: true, message: 'Mensagem marcada como não lida' });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      await messageService.deleteMessage(id, req.user!.userId);
      res.status(200).json({ success: true, message: 'Mensagem excluída com sucesso' });
    } catch (err) {
      next(err);
    }
  }

  async getRaw(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const raw = await messageService.getMessageRaw(id, req.user!.userId);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(raw);
    } catch (err) {
      next(err);
    }
  }

  async getHeaders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const headers = await messageService.getMessageHeaders(id, req.user!.userId);
      res.status(200).json({ success: true, data: headers });
    } catch (err) {
      next(err);
    }
  }

  async getAttachments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const attachments = await messageService.getMessageAttachments(id, req.user!.userId);
      res.status(200).json({ success: true, data: attachments });
    } catch (err) {
      next(err);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await messageService.getStats(req.user!.userId);
      res.status(200).json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }
}

export const messageController = new MessageController();
