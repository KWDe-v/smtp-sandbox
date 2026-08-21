import { Router } from 'express';
import { messageController } from '../controllers/message.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', (req, res, next) => messageController.search(req, res, next));
router.get('/search', (req, res, next) => messageController.search(req, res, next));
router.get('/recent', (req, res, next) => messageController.getRecent(req, res, next));
router.get('/stats', (req, res, next) => messageController.getStats(req, res, next));
router.get('/mailbox/:id', (req, res, next) => messageController.listByMailbox(req, res, next));
router.get('/:id', (req, res, next) => messageController.get(req, res, next));
router.delete('/:id', (req, res, next) => messageController.delete(req, res, next));
router.patch('/:id/read', (req, res, next) => messageController.markAsRead(req, res, next));
router.patch('/:id/unread', (req, res, next) => messageController.markAsUnread(req, res, next));
router.get('/:id/raw', (req, res, next) => messageController.getRaw(req, res, next));
router.get('/:id/headers', (req, res, next) => messageController.getHeaders(req, res, next));
router.get('/:id/attachments', (req, res, next) => messageController.getAttachments(req, res, next));

export default router;
