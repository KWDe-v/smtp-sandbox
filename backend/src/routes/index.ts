import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import domainRoutes from './domain.routes.js';
import mailboxRoutes from './mailbox.routes.js';
import apiKeyRoutes from './api-key.routes.js';
import aliasRoutes from './alias.routes.js';
import messageRoutes from './message.routes.js';
import attachmentRoutes from './attachment.routes.js';
import eventRoutes from './event.routes.js';
import internalRoutes from './internal.routes.js';

const router = Router();

// Rotas da API
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/domains', domainRoutes);
router.use('/mailboxes', mailboxRoutes);
router.use('/api-keys', apiKeyRoutes);
router.use('/aliases', aliasRoutes);
router.use('/messages', messageRoutes);
router.use('/attachments', attachmentRoutes);
router.use('/events', eventRoutes);
router.use('/internal', internalRoutes);

export default router;
