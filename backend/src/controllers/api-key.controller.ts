import { Request, Response, NextFunction } from 'express';
import { apiKeyService } from '../services/api-key.service.js';
import { createApiKeySchema } from '../validators/api-key.validator.js';

export class ApiKeyController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const keys = await apiKeyService.listKeys(req.user!.userId);
      res.status(200).json({ success: true, data: keys });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createApiKeySchema.parse(req.body);
      const result = await apiKeyService.createKey(req.user!.userId, validated.name, validated.expiresInDays);

      res.status(201).json({
        success: true,
        message: 'API Key gerada com sucesso. Guarde o token com segurança pois ele não será exibido novamente.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      await apiKeyService.deleteKey(id, req.user!.userId);
      res.status(200).json({ success: true, message: 'API Key revogada com sucesso' });
    } catch (err) {
      next(err);
    }
  }
}

export const apiKeyController = new ApiKeyController();
