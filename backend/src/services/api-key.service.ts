import { apiKeyRepository } from '../repositories/api-key.repository.js';
import { generateApiKey } from '../utils/hash.js';
import { ApiKey } from '../types/index.js';

export interface CreatedApiKeyResult {
  apiKey: ApiKey;
  token: string; // Exibido apenas uma vez para o usuário
}

export class ApiKeyService {
  async listKeys(userId: number): Promise<ApiKey[]> {
    return apiKeyRepository.findByUserId(userId);
  }

  async createKey(userId: number, name: string, expiresInDays?: number | null): Promise<CreatedApiKeyResult> {
    const { key, hash } = generateApiKey();

    let expiresAt: Date | undefined;
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
    }

    const created = await apiKeyRepository.create({
      userId,
      name,
      keyHash: hash,
      expiresAt,
    });

    return {
      apiKey: created,
      token: key,
    };
  }

  async deleteKey(id: number, userId: number): Promise<void> {
    const deleted = await apiKeyRepository.delete(id, userId);
    if (!deleted) {
      const error = new Error('API Key não encontrada ou sem permissão');
      (error as any).statusCode = 404;
      throw error;
    }
  }
}

export const apiKeyService = new ApiKeyService();
