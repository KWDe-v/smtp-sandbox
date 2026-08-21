import { z } from 'zod';

export const createApiKeySchema = z.object({
  name: z.string().min(1, 'Nome da chave obrigatório').max(100),
  expiresInDays: z.number().int().positive().max(365).optional(),
});
