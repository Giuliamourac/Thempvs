import { z } from 'zod';

// Mensagem diferente para "campo ausente" e "valor com tipo errado".
const campo = (rotulo) => ({
  error: (issue) =>
    issue.input === undefined
      ? `O campo ${rotulo.toLowerCase()} é obrigatório.`
      : `O campo ${rotulo.toLowerCase()} é inválido.`,
});

// Aceita número ou texto numérico ("19,90" / "19.90"); texto vazio NÃO vira 0.
const numeroDeTexto = (valor) => {
  if (typeof valor !== 'string') return valor;
  const limpo = valor.trim().replace(',', '.');
  return limpo === '' ? undefined : Number(limpo);
};

const unicos = (lista) => {
  const vistos = new Set();
  return lista.filter((item) => {
    const chave = item.toLowerCase();
    if (vistos.has(chave)) return false;
    vistos.add(chave);
    return true;
  });
};

const listaDeTextos = (rotulo, { min = 0 } = {}) =>
  z
    .array(z.string(campo(rotulo)).trim().min(1, `${rotulo}: item vazio.`).max(30, `${rotulo}: máximo de 30 caracteres por item.`), campo(rotulo))
    .min(min, min > 0 ? `Informe ao menos ${min} item em ${rotulo.toLowerCase()}.` : undefined)
    .max(30, `${rotulo}: máximo de 30 itens.`)
    .transform(unicos);

const imagemUrl = z
  .string(campo('URL da imagem'))
  .trim()
  .max(500, 'A URL da imagem deve ter no máximo 500 caracteres.')
  .nullish()
  .transform((valor) => valor || null)
  .refine(
    (valor) => valor === null || /^https?:\/\/\S+$/i.test(valor) || /^\/(?!\/)\S*$/.test(valor),
    'A URL da imagem deve começar com http://, https:// ou /.',
  );

const inteiroNaoNegativo = (rotulo, maximo = 1_000_000) =>
  z.preprocess(
    numeroDeTexto,
    z
      .number(campo(rotulo))
      .int(`${rotulo}: informe um número inteiro.`)
      .min(0, `${rotulo}: não pode ser negativo.`)
      .max(maximo, `${rotulo}: valor muito alto.`),
  );

/** Estoque de UMA combinação tamanho x cor. `cor` é null quando o produto não tem cores. */
const variacao = z.object({
  tamanho: z.string(campo('Tamanho')).trim().min(1, 'Variação: informe o tamanho.'),
  cor: z
    .string(campo('Cor'))
    .trim()
    .nullish()
    .transform((valor) => valor || null),
  estoque: inteiroNaoNegativo('Estoque'),
});

/** Uma URL de imagem da galeria (nossa ou externa). */
const urlImagem = z
  .string(campo('Imagem'))
  .trim()
  .min(1, 'Imagem: URL vazia.')
  .max(500, 'A URL da imagem deve ter no máximo 500 caracteres.')
  .refine(
    (valor) => /^https?:\/\/\S+$/i.test(valor) || /^\/(?!\/)\S*$/.test(valor),
    'A URL da imagem deve começar com http://, https:// ou /.',
  );

// Vazio ("" ou null) vira null; texto numérico ("19,90") vira número.
const numeroOuNulo = (valor) => (valor === null || valor === undefined || valor === '' ? null : numeroDeTexto(valor));

const medida = (rotulo) =>
  z.preprocess(
    numeroOuNulo,
    z
      .number(campo(rotulo))
      .min(0, `${rotulo}: não pode ser negativo.`)
      .max(500, `${rotulo}: valor muito alto.`)
      .transform((valor) => Math.round(valor * 10) / 10)
      .nullable(),
  );

/** Medidas (cm) de UM tamanho. Qualquer campo pode ficar vazio. */
const medidasDoTamanho = z.object({
  tamanho: z.string(campo('Tamanho')).trim().min(1, 'Medidas: informe o tamanho.'),
  busto_cm: medida('Busto'),
  cintura_cm: medida('Cintura'),
  quadril_cm: medida('Quadril'),
  ombros_cm: medida('Ombros'),
  comprimento_cm: medida('Comprimento'),
  manga_cm: medida('Manga'),
  coxa_cm: medida('Coxa'),
});

/** Corpo aceito por POST e PUT /api/products. */
export const productSchema = z
  .object({
  nome: z
    .string(campo('Nome'))
    .trim()
    .min(2, 'O nome deve ter ao menos 2 caracteres.')
    .max(150, 'O nome deve ter no máximo 150 caracteres.'),

  descricao: z
    .string(campo('Descrição'))
    .trim()
    .max(5000, 'A descrição deve ter no máximo 5000 caracteres.')
    .nullish()
    .transform((valor) => valor ?? ''),

  preco: z.preprocess(
    numeroDeTexto,
    z
      .number(campo('Preço'))
      .min(0, 'O preço não pode ser negativo.')
      .max(99999999.99, 'Preço muito alto.')
      .transform((valor) => Math.round(valor * 100) / 100),
  ),

  categoria: z
    .string(campo('Categoria'))
    .trim()
    .min(1, 'Informe a categoria.')
    .max(80, 'A categoria deve ter no máximo 80 caracteres.'),

  // Preço promocional (opcional): é o que o cliente paga quando preenchido. Vazio = sem promoção.
  preco_promocional: z.preprocess(
    numeroOuNulo,
    z
      .number(campo('Preço promocional'))
      .min(0, 'O preço promocional não pode ser negativo.')
      .max(99999999.99, 'Preço promocional muito alto.')
      .transform((valor) => Math.round(valor * 100) / 100)
      .nullable(),
  ),

  // Coleção (opcional): o "slug" de uma coleção que já existe (veja GET /api/colecoes).
  colecao: z
    .string(campo('Coleção'))
    .trim()
    .max(150, 'Coleção inválida.')
    .nullish()
    .transform((valor) => valor || null),

  tamanhos: listaDeTextos('Tamanhos', { min: 1 }),

  cores: listaDeTextos('Cores').default([]),

  // Estoque por combinação. Combinações que não aparecerem aqui ficam com 0 (novas) ou mantêm o valor (existentes).
  variacoes: z.array(variacao, campo('Estoque por variação')).max(900, 'Variações demais.').default([]),

  // A coluna produtos.peso_gramas é NOT NULL no banco.
  peso_gramas: z.preprocess(
    numeroDeTexto,
    z
      .number(campo('Peso'))
      .int('O peso deve ser um número inteiro, em gramas.')
      .min(1, 'O peso deve ser de ao menos 1 grama.')
      .max(100_000, 'Peso muito alto.'),
  ),

  // Medidas por tamanho (opcional).
  medidas: z.array(medidasDoTamanho, campo('Medidas')).max(60, 'Medidas demais.').default([]),

  // Galeria: a PRIMEIRA imagem é a capa.
  imagens: z.array(urlImagem, campo('Imagens')).max(8, 'No máximo 8 imagens por produto.').default([]),

  // Campo antigo (uma imagem só): continua aceito e vira a primeira da galeria.
  imagem_url: imagemUrl,
  })
  .superRefine((dados, ctx) => {
    const tamanhos = new Set(dados.tamanhos.map((t) => t.toLowerCase()));
    const cores = new Set(dados.cores.map((c) => c.toLowerCase()));
    const vistas = new Set();

    if (dados.preco_promocional !== null && dados.preco_promocional >= dados.preco) {
      ctx.addIssue({
        code: 'custom',
        path: ['preco_promocional'],
        message: 'O preço promocional deve ser menor que o preço normal.',
      });
    }

    const tamanhosMedidos = new Set();
    dados.medidas.forEach((item, indice) => {
      const chave = item.tamanho.toLowerCase();
      if (!tamanhos.has(chave)) {
        ctx.addIssue({ code: 'custom', path: ['medidas', indice, 'tamanho'], message: `Medidas: o tamanho "${item.tamanho}" não está na lista de tamanhos do produto.` });
      } else if (tamanhosMedidos.has(chave)) {
        ctx.addIssue({ code: 'custom', path: ['medidas', indice, 'tamanho'], message: `Medidas: tamanho repetido (${item.tamanho}).` });
      }
      tamanhosMedidos.add(chave);
    });

    dados.variacoes.forEach((item, indice) => {
      const erro = (campoErro, message) => ctx.addIssue({ code: 'custom', path: ['variacoes', indice, campoErro], message });

      if (!tamanhos.has(item.tamanho.toLowerCase())) {
        erro('tamanho', `Estoque: o tamanho "${item.tamanho}" não está na lista de tamanhos do produto.`);
      }
      if (cores.size === 0 && item.cor !== null) {
        erro('cor', 'Estoque: este produto não tem cores cadastradas.');
      } else if (cores.size > 0 && (item.cor === null || !cores.has(item.cor.toLowerCase()))) {
        erro('cor', `Estoque: a cor "${item.cor ?? ''}" não está na lista de cores do produto.`);
      }

      const chave = `${item.tamanho.toLowerCase()}|${(item.cor ?? '').toLowerCase()}`;
      if (vistas.has(chave)) erro('tamanho', `Estoque: combinação repetida (${item.tamanho}${item.cor ? ` / ${item.cor}` : ''}).`);
      vistas.add(chave);
    });
  })
  .transform((dados) => {
    // Compatibilidade: sem galeria mas com o campo antigo imagem_url → a galeria é só essa imagem.
    const { imagem_url: antiga, ...resto } = dados;
    const imagens = [...new Set(resto.imagens.length ? resto.imagens : antiga ? [antiga] : [])];
    return { ...resto, imagens };
  });

/** Parâmetro :id — inteiro positivo. */
export const idSchema = z.coerce
  .number({ error: 'ID inválido.' })
  .int('ID inválido.')
  .positive('ID inválido.');

// ---------- GET /api/products?... ----------

// ?cor=Preto&cor=Branco (repetido) ou ?cor=Preto → sempre uma lista.
const lista = z.preprocess(
  (valor) => (valor === undefined ? [] : Array.isArray(valor) ? valor : [valor]),
  z.array(z.string().trim().min(1).max(80)).max(30),
);

export const ORDENS = ['recentes', 'menor_preco', 'maior_preco', 'nome'];

export const listProductsQuery = z.object({
  categoria: lista,
  cor: lista,
  tamanho: lista,
  colecao: z.string().trim().max(150).optional(),
  q: z.string().trim().max(100).optional(),
  ordem: z.enum(ORDENS, { error: `ordem deve ser: ${ORDENS.join(', ')}.` }).default('recentes'),
  em_estoque: z
    .enum(['1', 'true', '0', 'false'])
    .optional()
    .transform((valor) => valor === '1' || valor === 'true'),
  pagina: z.coerce.number({ error: 'pagina inválida.' }).int().min(1).default(1),
  limite: z.coerce.number({ error: 'limite inválido.' }).int().min(1).max(100).default(12),
});

/** Parâmetro :ref de GET /api/products/:ref — um id (123) ou um slug (camiseta-preta). */
export const refSchema = z.string().trim().min(1).max(150);
