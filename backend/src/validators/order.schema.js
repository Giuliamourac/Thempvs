import { z } from 'zod';
import { SERVICOS } from '../services/frete.js';
import { uf } from './address.schema.js';

const itens = z
  .array(
    z.object({
      variacao_id: z.coerce.number({ error: 'Item inválido.' }).int().positive('Item inválido.'),
      quantidade: z.coerce
        .number({ error: 'Quantidade inválida.' })
        .int('Quantidade inválida.')
        .min(1, 'A quantidade mínima é 1.')
        .max(99, 'A quantidade máxima por item é 99.'),
    }),
    { error: 'Informe os itens do pedido.' },
  )
  .min(1, 'Seu carrinho está vazio.')
  .max(50, 'Itens demais em um único pedido.');

export const quoteSchema = z.object({
  itens,
  uf: uf.nullish().transform((valor) => valor || null),
});

export const createOrderSchema = z.object({
  itens,
  endereco_id: z.coerce.number({ error: 'Escolha o endereço de entrega.' }).int().positive('Escolha o endereço de entrega.'),
  frete_servico: z.enum(SERVICOS, { error: 'Escolha a forma de entrega.' }),
  // Cartão ainda não tem gateway de pagamento integrado; ver README.
  metodo_pagamento: z.enum(['pix', 'boleto'], { error: 'Escolha a forma de pagamento.' }),
});

export const statusSchema = z.object({
  status: z.enum(['Pago', 'Enviado', 'Entregue', 'Cancelado'], { error: 'Status inválido.' }),
  // Só usada ao marcar como "Enviado".
  transportadora: z
    .string()
    .trim()
    .max(100, 'Transportadora: máximo de 100 caracteres.')
    .nullish()
    .transform((valor) => valor || null),
});

export const listOrdersQuery = z.object({
  todos: z
    .enum(['1', 'true', '0', 'false'])
    .optional()
    .transform((valor) => valor === '1' || valor === 'true'),
  status: z.enum(['Pendente', 'Pago', 'Enviado', 'Cancelado', 'Entregue']).optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
});
