import { Router, raw } from 'express';
import { internalController } from '../controllers/internal.controller.js';

const router = Router();

// Validação de destinatário chamada pelo Haraka
router.post('/smtp/rcpt', (req, res, next) => internalController.validateRecipient(req, res, next));

// Ingestão de e-mail (suporta raw stream ou payload json)
router.post(
  '/smtp/incoming',
  raw({ type: ['message/rfc822', 'text/plain', 'application/octet-stream'], limit: '50mb' }),
  (req, res, next) => internalController.ingestEmail(req, res, next)
);

export default router;
