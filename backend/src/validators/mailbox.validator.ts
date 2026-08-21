import { z } from 'zod';

export const createMailboxSchema = z.object({
  domainId: z.number().int().positive('ID do domínio obrigatório'),
  username: z
    .string()
    .min(1, 'Nome da caixa de entrada obrigatório')
    .max(64)
    .regex(/^[a-zA-Z0-9._-]+$/, 'Nome da caixa de entrada inválido (use letras, números, ponto, traço ou sublinhado)'),
  password: z.string().min(6).optional(),
  quota: z.number().int().positive().optional(),
});
