import { z } from 'zod';

export const createApiKeySchema = z.object({
  name: z.string().min(1, 'Nome da chave obrigatório').max(100),
  expiresInDays: z.number().int().min(0).max(365).optional().nullable(),
});
