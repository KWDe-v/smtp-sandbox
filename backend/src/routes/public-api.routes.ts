import { Router } from 'express';
import { publicApiController } from '../controllers/public-api.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas as requisições exigem Token / Chave de API
router.use(authenticate);

// 1. GET /domains (Listar domínios)
router.get('/domains', (req, res, next) => publicApiController.getDomains(req, res, next));

// 2. POST /accounts (Criar conta/caixa com senha)
router.post('/accounts', (req, res, next) => publicApiController.createAccount(req, res, next));

// 3. Rotas de Mensagens (Exige email + senha)
router.get('/messages', (req, res, next) => publicApiController.getMessages(req, res, next));
router.post('/messages', (req, res, next) => publicApiController.getMessages(req, res, next));
router.get('/messages/:id', (req, res, next) => publicApiController.getMessageById(req, res, next));
router.delete('/messages/:id', (req, res, next) => publicApiController.deleteMessage(req, res, next));

export default router;
