import { Router } from 'express';
import { mailboxController } from '../controllers/mailbox.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', (req, res, next) => mailboxController.list(req, res, next));
router.post('/', (req, res, next) => mailboxController.create(req, res, next));
router.get('/:id', (req, res, next) => mailboxController.get(req, res, next));
router.delete('/:id', (req, res, next) => mailboxController.delete(req, res, next));

export default router;
