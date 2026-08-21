import { Request, Response, NextFunction } from 'express';
import { messageService } from '../services/message.service.js';

export class AttachmentController {
  async download(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const file = await messageService.downloadAttachment(id, req.user!.userId);

      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.filename)}"`);
      res.send(file.buffer);
    } catch (err) {
      next(err);
    }
  }
}

export const attachmentController = new AttachmentController();
