import { Router } from 'express';
import { webhookController } from '../controllers/webhook.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', (req, res, next) => webhookController.list(req, res, next));
router.post('/', (req, res, next) => webhookController.create(req, res, next));
router.patch('/:id', (req, res, next) => webhookController.update(req, res, next));
router.delete('/:id', (req, res, next) => webhookController.delete(req, res, next));

export default router;
