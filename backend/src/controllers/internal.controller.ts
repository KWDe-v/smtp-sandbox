import { Request, Response, NextFunction } from 'express';
import { mailboxRepository } from '../repositories/mailbox.repository.js';
import { aliasRepository } from '../repositories/alias.repository.js';
import { messageService } from '../services/message.service.js';

export class InternalController {
  async validateRecipient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const recipient = (req.body?.recipient as string || '').toLowerCase().trim();
      if (!recipient) {
        res.status(400).json({ valid: false, error: 'Destinatário não informado' });
        return;
      }

      // Verifica Alias
      const alias = await aliasRepository.findByAlias(recipient);
      if (alias) {
        res.status(200).json({ valid: true, destination: alias.destination });
        return;
      }

      // Verifica Mailbox
      const mailbox = await mailboxRepository.findByEmail(recipient);
      if (mailbox && mailbox.status === 'active') {
        res.status(200).json({ valid: true, mailboxId: mailbox.id });
        return;
      }

      res.status(404).json({ valid: false, error: 'Caixa postal não existe ou inativa' });
    } catch (err) {
      next(err);
    }
  }

  async ingestEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let rawEmailContent: string | Buffer = '';

      if (typeof req.body === 'string') {
        rawEmailContent = req.body;
      } else if (Buffer.isBuffer(req.body)) {
        rawEmailContent = req.body;
      } else if (req.body?.raw) {
        rawEmailContent = req.body.raw;
      } else {
        rawEmailContent = JSON.stringify(req.body);
      }

      const result = await messageService.processIncomingEmail(rawEmailContent);

      res.status(201).json({
        success: true,
        message: 'E-mail processado e armazenado com sucesso',
        data: {
          id: result.message.id,
          recipient: result.mailboxEmail,
          subject: result.message.subject,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const internalController = new InternalController();
