import { Router } from 'express';
import { aliasController } from '../controllers/alias.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', (req, res, next) => aliasController.list(req, res, next));
router.post('/', (req, res, next) => aliasController.create(req, res, next));
router.delete('/:id', (req, res, next) => aliasController.delete(req, res, next));

export default router;
