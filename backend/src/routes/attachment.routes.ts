import { Router } from 'express';
import { attachmentController } from '../controllers/attachment.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/:id', (req, res, next) => attachmentController.download(req, res, next));

export default router;
