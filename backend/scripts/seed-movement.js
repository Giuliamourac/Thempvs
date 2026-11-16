/**
 * Cadastra no banco a coleção Movement (antes fixa no frontend): 8 peças, 14 combinações peça x cor.
 * Cada peça é um produto com seletor de cor; a foto da página muda conforme a cor escolhida.
 *
 *   npm run seed:movement             grava no banco
 *   npm run seed:movement -- --dry-run   só mostra o que faria (não grava nada)
 *
 * Segurança:
 *  - IDEMPOTENTE: cada produto é identificado pelo slug; se já existe, é PULADO (nada é sobrescrito,
 *    então preço/estoque/fotos editados no painel nunca são desfeitos ao rodar de novo);
 *  - não apaga nem altera nenhum produto existente;
 *  - se a primeira versão deste seed (um produto por cor) já foi executada, as quantidades de estoque
 *    informadas nela são copiadas para o produto unificado e os produtos antigos saem da loja
 *    (apagados se nunca vendidos; desativados se têm pedidos);
 *  - usa o mesmo caminho do painel (models/product.model.js → create), então categoria, cores,
 *    tamanhos, variações de estoque e galeria seguem exatamente a arquitetura atual.
 *
 * ESTOQUE: não foi informado. Todas as variações (P, M, G de cada produto) nascem com 0 —
 * os produtos aparecem na loja como "Esgotado" até o administrador informar as quantidades reais
 * no painel (Administração de produtos → Editar → "Estoque por variação", uma linha por tamanho e cor).
 *
 * IMAGENS: ficam em frontend/public/images/products/<cor>/ e são gravadas no banco como caminho
 * relativo (/images/products/black/ana-preto.jpg), uma lista por cor, servido pelo próprio frontend.
 */
import { pathToFileURL } from 'node:url';
import { pool } from '../src/config/db.js';
import * as Product from '../src/models/product.model.js';
import { criarColecao } from '../src/models/catalog.model.js';
import { productSchema } from '../src/validators/product.schema.js';
import { slugify } from '../src/utils/slug.js';

const DRY_RUN = process.argv.includes('--dry-run');

const TAMANHOS = ['P', 'M', 'G'];
const NOME_COLECAO = 'Movement';
const CATEGORIA_CONJUNTOS = 'Conjuntos';
const CATEGORIA_MACACOES = 'Macacões e macaquinhos';

// O peso é obrigatório no banco (entra no cálculo do frete) e não foi informado:
// 300 g é um valor provisório para todas as peças. Ajuste no painel (campo "Peso").
const PESO_PROVISORIO_GRAMAS = 300;

const IMG = (cor, arquivo) => `/images/products/${cor}/${arquivo}`;

const DESCRICOES = {
  ana: 'Conjunto fitness de visual moderno, composto por cropped de mangas curtas e legging de cintura alta. Uma combinação versátil para treinos e para compor looks esportivos no dia a dia.',
  flora:
    'Conjunto fitness com top de alças finas e detalhe trançado na parte frontal, acompanhado de legging ajustada. Uma proposta delicada e moderna que valoriza os detalhes da peça.',
  beatriz:
    'Conjunto fitness com blusa de alças duplas e detalhes contrastantes em preto e branco. Possui visual diferenciado e moderno, ideal para quem procura um look esportivo com personalidade.',
  julia:
    'Conjunto fitness com modelagem moderna e detalhes diferenciados no cós, proporcionando um visual esportivo e versátil para diferentes ocasiões.',
  jade: 'Conjunto fitness composto por top e calça legging comprida, com proposta minimalista e elegante. Ideal para quem prefere peças básicas e versáteis.',
  melissa:
    'Conjunto fitness composto por regata cropped e legging comprida de cintura alta. Uma combinação prática e atemporal para acompanhar a rotina de treinos.',
  iris: 'Macacão fitness de modelagem ajustada, com recorte estratégico na região abdominal. Uma peça moderna que combina estilo esportivo e praticidade em uma única composição.',
  lua: 'Macaquinho fitness de comprimento curto, com costas abertas e detalhes de alças trançadas. Uma peça diferenciada que combina praticidade e estilo para os treinos.',
};

/**
 * 8 peças, cada uma com suas cores (14 combinações peça x cor). Uma peça é UM produto com seletor de cor:
 * preço, descrição e ativo/inativo valem para a peça; estoque e fotos são por cor.
 * Na ordem em que devem aparecer na loja (a vitrine mostra os mais recentes primeiro; veja o loop abaixo).
 * A primeira cor de cada peça é a que aparece na capa da listagem.
 */
export const PRODUTOS = [
  { nome: 'Conjunto Ana', preco: 159.9, categoria: CATEGORIA_CONJUNTOS, descricao: DESCRICOES.ana, cores: [
    { cor: 'Branco', imagens: [IMG('white', 'ana-branco.jpg')] },
    { cor: 'Preto', imagens: [IMG('black', 'ana-preto.jpg')] },
    { cor: 'Cinza', imagens: [IMG('gray', 'ana-cinza.jpg')] },
  ] },
  { nome: 'Conjunto Flora', preco: 169.9, categoria: CATEGORIA_CONJUNTOS, descricao: DESCRICOES.flora, cores: [
    { cor: 'Branco', imagens: [IMG('white', 'flora-branco.jpg')] },
    { cor: 'Preto', imagens: [IMG('black', 'flora-preto.jpg')] },
  ] },
  // galeria: foto frontal + foto secundária (a primeira é a capa)
  { nome: 'Conjunto Beatriz', preco: 179.9, categoria: CATEGORIA_CONJUNTOS, descricao: DESCRICOES.beatriz, cores: [
    { cor: 'Preto', imagens: [IMG('black', 'beatriz-preto-1.jpg'), IMG('black', 'beatriz-preto-2.jpg')] },
  ] },
  { nome: 'Conjunto Júlia', preco: 149.9, categoria: CATEGORIA_CONJUNTOS, descricao: DESCRICOES.julia, cores: [
    { cor: 'Cinza', imagens: [IMG('gray', 'julia-cinza.jpg')] },
    { cor: 'Preto', imagens: [IMG('black', 'julia-preto.jpg')] },
  ] },
  { nome: 'Conjunto Jade', preco: 169.9, categoria: CATEGORIA_CONJUNTOS, descricao: DESCRICOES.jade, cores: [
    { cor: 'Preto', imagens: [IMG('black', 'jade-preto.jpg')] },
  ] },
  { nome: 'Conjunto Melissa', preco: 159.9, categoria: CATEGORIA_CONJUNTOS, descricao: DESCRICOES.melissa, cores: [
    { cor: 'Branco', imagens: [IMG('white', 'melissa-branco.jpg')] },
    { cor: 'Preto', imagens: [IMG('black', 'melissa-preto.jpg')] },
  ] },
  { nome: 'Macacão Íris', preco: 189.9, categoria: CATEGORIA_MACACOES, descricao: DESCRICOES.iris, cores: [
    { cor: 'Branco', imagens: [IMG('white', 'iris-branco.jpg')] },
    { cor: 'Cinza', imagens: [IMG('gray', 'iris-cinza.jpg')] },
  ] },
  { nome: 'Macaquinho Lua', preco: 149.9, categoria: CATEGORIA_MACACOES, descricao: DESCRICOES.lua, cores: [
    { cor: 'Preto', imagens: [IMG('black', 'lua-preto-1.jpg'), IMG('black', 'lua-preto-2.jpg')] },
  ] },
];

export const slugDe = ({ nome }) => slugify(nome);

/** Slugs da primeira versão do seed, em que cada cor era um produto (ex.: conjunto-ana-preto). */
export const slugsAntigos = ({ nome, cores }) => cores.map(({ cor }) => ({ cor, slug: slugify(`${nome} ${cor}`) }));

/**
 * Monta o corpo no formato do painel e passa pelo MESMO validador da API (productSchema).
 * `estoques` = { 'Cor|Tamanho': quantidade } para preservar quantidades já informadas; o resto começa em 0.
 */
export function montarProduto(item, colecao, estoques = new Map()) {
  return productSchema.parse({
    nome: item.nome,
    descricao: item.descricao,
    preco: item.preco,
    preco_promocional: null,
    categoria: item.categoria,
    colecao,
    tamanhos: TAMANHOS,
    cores: item.cores.map(({ cor }) => cor),
    // Uma linha de estoque POR tamanho (P, M, G) de CADA cor — zeradas, salvo quantidade já informada antes.
    variacoes: item.cores.flatMap(({ cor }) =>
      TAMANHOS.map((tamanho) => ({ tamanho, cor, estoque: estoques.get(`${cor}|${tamanho}`) ?? 0 })),
    ),
    peso_gramas: PESO_PROVISORIO_GRAMAS,
    medidas: [],
    imagens: [],
    imagens_por_cor: Object.fromEntries(item.cores.map(({ cor, imagens }) => [cor, imagens])),
    ativo: true,
  });
}

/**
 * Se a primeira versão do seed já rodou (14 produtos, um por cor), lê o estoque que o administrador
 * informou neles para repassá-lo ao produto novo e devolve os ids antigos.
 */
async function lerAntigos(item) {
  const antigos = slugsAntigos(item);
  const [produtos] = await pool.query('SELECT id_produto AS id, slug FROM produtos WHERE slug IN (?)', [antigos.map((a) => a.slug)]);
  if (produtos.length === 0) return { ids: [], estoques: new Map() };

  const [variacoes] = await pool.query(
    `SELECT c.nm_cor AS cor, t.sg_tamanho AS tamanho, v.estoque
       FROM produto_variacao v JOIN tamanho t ON t.id_tamanho = v.id_tamanho JOIN cores c ON c.id_cor = v.id_cor
      WHERE v.id_produto IN (?)`,
    [produtos.map((p) => p.id)],
  );
  const estoques = new Map(variacoes.map((v) => [`${v.cor}|${v.tamanho}`, v.estoque]));
  return { ids: produtos.map((p) => p.id), estoques };
}

/** Tira da loja os produtos por cor da primeira versão: apaga se nunca foram vendidos, senão só desativa. */
async function aposentarAntigos(ids) {
  for (const id of ids) {
    const [pedidos] = await pool.query('SELECT COUNT(*) AS total FROM item_pedidos WHERE id_produto = ?', [id]);
    if (pedidos[0].total > 0) {
      await pool.query('UPDATE produtos SET ativo = FALSE WHERE id_produto = ?', [id]);
      console.log(`  - produto antigo ${id} tem pedidos: desativado (histórico preservado).`);
    } else {
      await pool.query('DELETE FROM produtos WHERE id_produto = ?', [id]); // variações e fotos saem em cascata
      console.log(`  - produto antigo ${id} (uma cor só) removido: foi unificado.`);
    }
  }
}

/** Slug da coleção Movement (já cadastrada, por slug ou nome) ou cria a coleção. */
async function garantirColecao() {
  const [existentes] = await pool.query(
    'SELECT slug FROM colecao WHERE slug = ? OR LOWER(nm_colecao) = ? ORDER BY slug = ? DESC LIMIT 1',
    [slugify(NOME_COLECAO), NOME_COLECAO.toLowerCase(), slugify(NOME_COLECAO)],
  );
  if (existentes[0]?.slug) return existentes[0].slug;
  if (DRY_RUN) return slugify(NOME_COLECAO);

  const nova = await criarColecao(NOME_COLECAO, 'Moda fitness da Thempvs.');
  console.log(`Coleção "${NOME_COLECAO}" criada.`);
  return nova.slug;
}

async function main() {
  const colecao = await garantirColecao();
  let criados = 0;
  let pulados = 0;

  // A vitrine ordena do mais novo ao mais antigo; inserindo do último ao primeiro, a lista
  // acima é a ordem em que as peças aparecem na loja (Conjunto Ana primeiro).
  for (const item of [...PRODUTOS].reverse()) {
    const slug = slugDe(item);
    const [linhas] = await pool.query('SELECT id_produto AS id FROM produtos WHERE slug = ? LIMIT 1', [slug]);
    const existe = linhas[0];

    if (existe) {
      pulados += 1;
      console.log(`= ${slug} já existe (id ${existe.id}) — mantido como está.`);
      continue;
    }

    const antigos = await lerAntigos(item);
    const dados = { ...montarProduto(item, colecao, antigos.estoques), slug };
    const cores = dados.cores.join('/');

    if (DRY_RUN) {
      criados += 1;
      const migra = antigos.ids.length ? `, unifica ${antigos.ids.length} produto(s) antigo(s)` : '';
      console.log(`+ ${slug}: R$ ${dados.preco.toFixed(2)}, cores ${cores}, ${dados.tamanhos.join('/')}${migra} (simulação)`);
      continue;
    }

    const criado = await Product.create(dados);
    criados += 1;
    console.log(`+ ${criado.slug} (id ${criado.id}): R$ ${criado.preco.toFixed(2)}, cores ${cores}, variações ${criado.variacoes.length}`);
    await aposentarAntigos(antigos.ids);
  }

  console.log(`\n${DRY_RUN ? '[simulação] ' : ''}${criados} produto(s) cadastrado(s), ${pulados} já existiam.`);
  if (criados > 0 && !DRY_RUN) {
    console.log('ATENÇÃO: o estoque de todas as variações começou em 0. Informe as quantidades reais no painel antes de vender.');
  }
}

// Só executa quando chamado direto (npm run seed:movement); importar o arquivo (testes) não grava nada.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await main();
  } catch (erro) {
    console.error('\nFalha no seed:', erro.sqlMessage ?? erro.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
