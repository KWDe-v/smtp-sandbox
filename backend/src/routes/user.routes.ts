import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', (req, res, next) => authController.me(req, res, next));
router.patch('/', (req, res, next) => authController.updateProfile(req, res, next));

export default router;
