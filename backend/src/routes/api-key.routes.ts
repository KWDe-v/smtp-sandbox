import { Router } from 'express';
import { apiKeyController } from '../controllers/api-key.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', (req, res, next) => apiKeyController.list(req, res, next));
router.post('/', (req, res, next) => apiKeyController.create(req, res, next));
router.delete('/:id', (req, res, next) => apiKeyController.delete(req, res, next));

export default router;
