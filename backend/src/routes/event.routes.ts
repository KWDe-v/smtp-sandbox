import { Router } from 'express';
import { eventController } from '../controllers/event.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Endpoint SSE (requer autenticação JWT ou API Key na query ou header)
router.get('/', (req, res) => {
  // Permite token passado como query param para conexões EventSource do navegador
  if (req.query.token && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  authenticate(req, res, () => eventController.subscribe(req, res));
});

export default router;
