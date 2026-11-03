import { z } from 'zod';
import { UFS } from '../utils/ufs.js';

const texto = (rotulo, { min = 1, max }) =>
  z
    .string({ error: `Informe ${rotulo.toLowerCase()}.` })
    .trim()
    .min(min, `Informe ${rotulo.toLowerCase()}.`)
    .max(max, `${rotulo}: máximo de ${max} caracteres.`);

export const uf = z
  .string({ error: 'Selecione o estado.' })
  .trim()
  .toUpperCase()
  .refine((valor) => UFS.includes(valor), 'Selecione um estado válido.');

export const addressSchema = z.object({
  destinatario: texto('O nome do destinatário', { min: 3, max: 150 }),
  // aceita "11000-000" e "11000000"
  cep: z
    .string({ error: 'Informe o CEP.' })
    .transform((valor) => valor.replace(/\D/g, ''))
    .refine((valor) => valor.length === 8, 'O CEP deve ter 8 números.'),
  rua: texto('A rua', { max: 150 }),
  numero: texto('O número', { max: 10 }),
  complemento: z
    .string()
    .trim()
    .max(100, 'Complemento: máximo de 100 caracteres.')
    .nullish()
    .transform((valor) => valor || null),
  bairro: texto('O bairro', { max: 80 }),
  cidade: texto('A cidade', { max: 80 }),
  uf,
  padrao: z.boolean().default(false),
});
