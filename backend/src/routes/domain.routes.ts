import { Router } from 'express';
import { domainController } from '../controllers/domain.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', (req, res, next) => domainController.list(req, res, next));
router.post('/', (req, res, next) => domainController.create(req, res, next));
router.get('/:id', (req, res, next) => domainController.get(req, res, next));
router.delete('/:id', (req, res, next) => domainController.delete(req, res, next));
router.post('/:id/verify', (req, res, next) => domainController.verify(req, res, next));

export default router;
