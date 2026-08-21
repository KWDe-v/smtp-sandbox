import { Request, Response, NextFunction } from 'express';
import { aliasService } from '../services/alias.service.js';
import { createAliasSchema } from '../validators/alias.validator.js';

export class AliasController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const aliases = await aliasService.listUserAliases(req.user!.userId);
      res.status(200).json({ success: true, data: aliases });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createAliasSchema.parse(req.body);
      const alias = await aliasService.createAlias(req.user!.userId, validated);
      res.status(201).json({
        success: true,
        message: 'Alias criado com sucesso',
        data: alias,
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      await aliasService.deleteAlias(id, req.user!.userId);
      res.status(200).json({ success: true, message: 'Alias excluído com sucesso' });
    } catch (err) {
      next(err);
    }
  }
}

export const aliasController = new AliasController();
