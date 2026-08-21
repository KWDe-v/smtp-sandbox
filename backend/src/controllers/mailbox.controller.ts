import { Request, Response, NextFunction } from 'express';
import { mailboxService } from '../services/mailbox.service.js';

export class MailboxController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const mailboxes = await mailboxService.listUserMailboxes(req.user!.userId);
      res.status(200).json({ success: true, data: mailboxes });
    } catch (err) {
      next(err);
    }
  }

  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const mailbox = await mailboxService.getMailbox(id, req.user!.userId);
      res.status(200).json({ success: true, data: mailbox });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { domainId, domain, domainName, username, email, password, quota } = req.body || {};
      const mailbox = await mailboxService.createMailbox(req.user!.userId, {
        domainId: domainId ? parseInt(domainId, 10) : undefined,
        domainName: domainName || domain,
        username,
        email,
        password,
        quota: quota ? parseInt(quota, 10) : undefined,
      });

      res.status(201).json({
        success: true,
        message: 'Caixa de e-mail criada com sucesso',
        data: mailbox,
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      await mailboxService.deleteMailbox(id, req.user!.userId);
      res.status(200).json({ success: true, message: 'Caixa postal excluída com sucesso' });
    } catch (err) {
      next(err);
    }
  }
}

export const mailboxController = new MailboxController();
