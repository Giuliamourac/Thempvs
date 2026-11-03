import { z } from 'zod';

const email = z
  .string({ error: 'Informe seu email.' })
  .trim()
  .toLowerCase()
  .max(120, 'O email deve ter no máximo 120 caracteres.')
  .pipe(z.email('Digite um email válido, como nome@exemplo.com.'));

const senhaNova = z
  .string({ error: 'Informe uma senha.' })
  .min(8, 'A senha deve ter ao menos 8 caracteres.')
  .refine((valor) => Buffer.byteLength(valor) <= 72, 'A senha deve ter no máximo 72 caracteres.');

const telefone = z
  .string()
  .trim()
  .max(20, 'O telefone deve ter no máximo 20 caracteres.')
  .nullish()
  .transform((valor) => valor || null);

export const registerSchema = z.object({
  nome: z
    .string({ error: 'Informe seu nome.' })
    .trim()
    .min(2, 'Informe seu nome completo.')
    .max(150, 'O nome deve ter no máximo 150 caracteres.'),
  email,
  senha: senhaNova,
  telefone,
});

export const loginSchema = z.object({
  email,
  senha: z.string({ error: 'Informe sua senha.' }).min(1, 'Informe sua senha.').max(200),
});
