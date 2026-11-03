import { z } from 'zod';

export const novoItemSchema = z.object({
  nome: z.string().trim().min(2, 'Informe o nome (mínimo 2 letras).').max(100, 'No máximo 100 caracteres.'),
  descricao: z.string().trim().max(1000).optional(),
});
