import { z } from 'zod';

export const createDomainSchema = z.object({
  domain: z
    .string()
    .min(3, 'O domínio deve ter no mínimo 3 caracteres')
    .max(255)
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-._]*\.[a-zA-Z]{2,}$/, 'Formato de domínio inválido (ex: sandbox.meudominio.com ou teste.local)'),
});
