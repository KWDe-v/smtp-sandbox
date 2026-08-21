import { z } from 'zod';

export const createAliasSchema = z.object({
  domainId: z.number().int().positive('ID do domínio obrigatório'),
  alias: z.string().min(1, 'Alias obrigatório').max(64),
  destination: z.string().email('Destino deve ser um e-mail válido'),
});
