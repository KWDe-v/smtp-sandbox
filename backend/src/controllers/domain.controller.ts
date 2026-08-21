import { Request, Response, NextFunction } from 'express';
import { domainService } from '../services/domain.service.js';
import { createDomainSchema } from '../validators/domain.validator.js';

export class DomainController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const domains = await domainService.listUserDomains(req.user!.userId);
      res.status(200).json({ success: true, data: domains });
    } catch (err) {
      next(err);
    }
  }

  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const domain = await domainService.getDomain(id, req.user!.userId);
      res.status(200).json({ success: true, data: domain });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createDomainSchema.parse(req.body);
      const domain = await domainService.createDomain(req.user!.userId, validated.domain);
      res.status(201).json({
        success: true,
        message: 'Domínio criado com sucesso',
        data: domain,
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      await domainService.deleteDomain(id, req.user!.userId);
      res.status(200).json({ success: true, message: 'Domínio excluído com sucesso' });
    } catch (err) {
      next(err);
    }
  }

  async verify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await domainService.verifyDomain(id, req.user!.userId);
      res.status(200).json({
        success: result.verified,
        message: result.message,
        data: result.domain,
        details: result.details,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const domainController = new DomainController();
