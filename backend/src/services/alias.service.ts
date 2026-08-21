import { aliasRepository } from '../repositories/alias.repository.js';
import { domainRepository } from '../repositories/domain.repository.js';
import { Alias } from '../types/index.js';

export class AliasService {
  async listUserAliases(userId: number): Promise<(Alias & { domain: string })[]> {
    return aliasRepository.findByUserId(userId);
  }

  async createAlias(
    userId: number,
    data: { domainId: number; alias: string; destination: string }
  ): Promise<Alias> {
    const domain = await domainRepository.findById(data.domainId, userId);
    if (!domain) {
      const error = new Error('Domínio informado não pertence a este usuário ou não existe');
      (error as any).statusCode = 404;
      throw error;
    }

    const fullAlias = `${data.alias.toLowerCase().trim()}@${domain.domain.toLowerCase().trim()}`;
    const existing = await aliasRepository.findByAlias(fullAlias);
    if (existing) {
      const error = new Error(`O alias ${fullAlias} já existe`);
      (error as any).statusCode = 409;
      throw error;
    }

    return aliasRepository.create({
      domainId: domain.id,
      alias: data.alias.toLowerCase().trim(),
      destination: data.destination.toLowerCase().trim(),
    });
  }

  async deleteAlias(id: number, userId: number): Promise<void> {
    const deleted = await aliasRepository.delete(id, userId);
    if (!deleted) {
      const error = new Error('Alias não encontrado ou sem permissão');
      (error as any).statusCode = 404;
      throw error;
    }
  }
}

export const aliasService = new AliasService();
