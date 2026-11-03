/**
 * Todo o SQL de produtos fica aqui. Tabelas usadas (veja database/schema.sql):
 *
 *   produtos ── categorias        (id_categoria, obrigatório)
 *      │
 *      ├── produto_tamanho ── tamanho     (opções de tamanho, em ordem)
 *      ├── produto_cor ────── cores       (opções de cor, em ordem)
 *      ├── produto_variacao               (ESTOQUE de cada combinação tamanho x cor)
 *      ├── produto_imagem                 (galeria; a primeira é a capa)
 *      ├── medidas_produto                (medidas por tamanho)
 *      └── colecao                        (opcional)
 *
 * A API fala em { nome, categoria, tamanhos, cores, ... }; aqui isso é traduzido
 * para as colunas do banco (nm_produto, id_categoria, ...).
 */
import { pool, withTransaction as comTransacao } from '../config/db.js';
import { removerImagem } from '../services/storage.js';
import { HttpError } from '../utils/httpError.js';
import { slugify } from '../utils/slug.js';

// ---------- helpers ----------

const NOMES_DE_CATEGORIAS = {
  camisetas: 'Camisetas',
  shorts: 'Shorts',
  bermudas: 'Bermudas',
  calcas: 'Calças',
  casacos: 'Casacos',
  conjuntos: 'Conjuntos',
  acessorios: 'Acessórios',
};

// Categorias conhecidas têm nome fixo; as demais usam o texto como foi digitado (com acentos).
const nomeDaCategoria = (slug, textoOriginal) => NOMES_DE_CATEGORIAS[slug] ?? textoOriginal.trim();

/**
 * Devolve o id da linha cujo `coluna` = `valor`, criando a linha se ainda não existir.
 * (tabela/colunas vêm sempre de constantes deste arquivo, nunca do usuário.)
 */
async function obterOuCriar(db, { tabela, id, coluna, extras = {} }, valor) {
  const [existentes] = await db.query('SELECT ?? AS id FROM ?? WHERE ?? = ? LIMIT 1', [id, tabela, coluna, valor]);
  if (existentes.length) return existentes[0].id;

  // ON DUPLICATE KEY cobre duas requisições criando o mesmo valor ao mesmo tempo.
  const [resultado] = await db.query('INSERT INTO ?? SET ? ON DUPLICATE KEY UPDATE ?? = LAST_INSERT_ID(??)', [
    tabela,
    { [coluna]: valor, ...extras },
    id,
    id,
  ]);
  return resultado.insertId;
}

const CATEGORIA = { tabela: 'categorias', id: 'id_categoria', coluna: 'slug' };
const TAMANHO = { tabela: 'tamanho', id: 'id_tamanho', coluna: 'sg_tamanho' };
const COR = { tabela: 'cores', id: 'id_cor', coluna: 'nm_cor' };

async function idDaCategoria(db, categoria) {
  const slug = slugify(categoria) || 'sem-categoria';
  const nome = nomeDaCategoria(slug, categoria);

  // Já existe uma categoria com esse slug — ou com esse nome (você pode ter cadastrado à mão)?
  const [existentes] = await db.query(
    'SELECT id_categoria AS id FROM categorias WHERE slug = ? OR nm_categoria = ? ORDER BY slug = ? DESC LIMIT 1',
    [slug, nome, slug],
  );
  if (existentes.length) return existentes[0].id;

  return obterOuCriar(db, { ...CATEGORIA, extras: { nm_categoria: nome } }, slug);
}

/** Grava a lista (tamanhos ou cores) de um produto, preservando a ordem escolhida. */
async function gravarLista(db, produtoId, valores, { vinculo, ...tabela }) {
  await db.query('DELETE FROM ?? WHERE id_produto = ?', [vinculo, produtoId]);

  const ordemPorId = new Map(); // dois valores "iguais" para o MySQL (ex.: Único/Unico) viram um só
  const idPorNome = new Map(); // nome em minúsculas -> id (para achar a linha de estoque depois)
  for (const valor of valores) {
    const id = await obterOuCriar(db, tabela, valor);
    idPorNome.set(valor.toLowerCase(), id);
    if (!ordemPorId.has(id)) ordemPorId.set(id, ordemPorId.size);
  }
  if (ordemPorId.size > 0) {
    await db.query('INSERT INTO ?? (id_produto, ??, ordem) VALUES ?', [
      vinculo,
      tabela.id,
      [...ordemPorId].map(([id, ordem]) => [produtoId, id, ordem]),
    ]);
  }
  return { ids: [...ordemPorId.keys()], idPorNome };
}

const gravarTamanhos = (db, produtoId, valores) =>
  gravarLista(db, produtoId, valores, { ...TAMANHO, vinculo: 'produto_tamanho' });

const gravarCores = (db, produtoId, valores) => gravarLista(db, produtoId, valores, { ...COR, vinculo: 'produto_cor' });

/**
 * Sincroniza produto_variacao com as opções escolhidas: uma linha por tamanho x cor.
 *  - combinação que já existe: mantém o id (carrinhos abertos continuam válidos) e só troca o estoque
 *    se o painel mandou um valor;
 *  - combinação nova: cria (estoque enviado, ou 0);
 *  - combinação que saiu da lista: apaga (itens de pedidos antigos guardam cópia dos dados).
 */
async function gravarVariacoes(db, produtoId, tamanhos, cores, variacoes) {
  const idsCores = cores.ids.length ? cores.ids : [null];
  const chave = (idTamanho, idCor) => `${idTamanho}:${idCor ?? 0}`;

  const estoqueEnviado = new Map();
  for (const item of variacoes) {
    const idTamanho = tamanhos.idPorNome.get(item.tamanho.toLowerCase());
    const idCor = item.cor === null ? null : cores.idPorNome.get(item.cor.toLowerCase());
    estoqueEnviado.set(chave(idTamanho, idCor), item.estoque);
  }

  const [atuais] = await db.query(
    'SELECT id_variacao AS id, id_tamanho AS tamanho, id_cor AS cor FROM produto_variacao WHERE id_produto = ? FOR UPDATE',
    [produtoId],
  );
  const atualPorChave = new Map(atuais.map((linha) => [chave(linha.tamanho, linha.cor), linha.id]));

  const desejadas = new Set();
  const novas = [];
  for (const idTamanho of tamanhos.ids) {
    for (const idCor of idsCores) {
      const k = chave(idTamanho, idCor);
      desejadas.add(k);
      const enviado = estoqueEnviado.get(k);

      if (!atualPorChave.has(k)) novas.push([produtoId, idTamanho, idCor, enviado ?? 0]);
      else if (enviado !== undefined) {
        await db.query('UPDATE produto_variacao SET estoque = ? WHERE id_variacao = ?', [enviado, atualPorChave.get(k)]);
      }
    }
  }

  const removidas = atuais.filter((linha) => !desejadas.has(chave(linha.tamanho, linha.cor))).map((linha) => linha.id);
  if (removidas.length) await db.query('DELETE FROM produto_variacao WHERE id_variacao IN (?)', [removidas]);
  if (novas.length) await db.query('INSERT INTO produto_variacao (id_produto, id_tamanho, id_cor, estoque) VALUES ?', [novas]);
}

const COLUNAS_MEDIDAS = ['busto_cm', 'cintura_cm', 'quadril_cm', 'ombros_cm', 'comprimento_cm', 'manga_cm', 'coxa_cm'];

/** Substitui as medidas do produto. Linhas totalmente vazias são ignoradas. */
async function gravarMedidas(db, produtoId, tamanhos, medidas) {
  await db.query('DELETE FROM medidas_produto WHERE id_produto = ?', [produtoId]);

  const linhas = medidas
    .filter((item) => COLUNAS_MEDIDAS.some((coluna) => item[coluna] !== null))
    .map((item) => [produtoId, tamanhos.idPorNome.get(item.tamanho.toLowerCase()), ...COLUNAS_MEDIDAS.map((c) => item[c])]);
  if (linhas.length === 0) return;

  await db.query(`INSERT INTO medidas_produto (id_produto, id_tamanho, ${COLUNAS_MEDIDAS.join(', ')}) VALUES ?`, [linhas]);
}

/**
 * Substitui a galeria do produto (a ordem da lista é a ordem de exibição; a primeira é a capa,
 * copiada em produtos.imagem_url). Devolve as URLs que SAÍRAM da galeria, para apagar os arquivos
 * depois que a transação der certo.
 */
async function gravarImagens(db, produtoId, urls) {
  const [antigas] = await db.query('SELECT url FROM produto_imagem WHERE id_produto = ?', [produtoId]);
  await db.query('DELETE FROM produto_imagem WHERE id_produto = ?', [produtoId]);
  if (urls.length) {
    await db.query('INSERT INTO produto_imagem (id_produto, url, ordem) VALUES ?', [
      urls.map((url, ordem) => [produtoId, url, ordem]),
    ]);
  }
  await db.query('UPDATE produtos SET imagem_url = ? WHERE id_produto = ?', [urls[0] ?? null, produtoId]);
  return antigas.map((linha) => linha.url).filter((url) => !urls.includes(url));
}

async function idDaColecao(db, slug) {
  if (!slug) return null;
  const [linhas] = await db.query('SELECT id_colecao AS id FROM colecao WHERE slug = ? LIMIT 1', [slug]);
  if (!linhas.length) {
    throw new HttpError(400, 'Dados inválidos.', [{ campo: 'colecao', mensagem: `A coleção "${slug}" não existe.` }]);
  }
  return linhas[0].id;
}

async function gravarOpcoes(db, produtoId, data) {
  const tamanhos = await gravarTamanhos(db, produtoId, data.tamanhos);
  const cores = await gravarCores(db, produtoId, data.cores);
  await gravarVariacoes(db, produtoId, tamanhos, cores, data.variacoes);
  await gravarMedidas(db, produtoId, tamanhos, data.medidas);
  return gravarImagens(db, produtoId, data.imagens);
}

/**
 * Apaga do storage as imagens que deixaram de ser usadas — só se nenhum outro produto
 * ainda as usa (a mesma URL pode estar em dois produtos). Erros aqui nunca derrubam a operação:
 * no pior caso sobra um arquivo órfão, que `npm run uploads:clean` recolhe depois.
 */
async function apagarImagensSemUso(urls) {
  for (const url of urls) {
    try {
      const [[uso]] = await pool.query(
        'SELECT (SELECT COUNT(*) FROM produto_imagem WHERE url = ?) + (SELECT COUNT(*) FROM produtos WHERE imagem_url = ?) AS total',
        [url, url],
      );
      if (uso.total === 0) await removerImagem(url);
    } catch (erro) {
      console.error('[imagens] não foi possível apagar', url, erro.message);
    }
  }
}

async function slugUnico(db, nome) {
  const base = slugify(nome) || 'produto';
  const [linhas] = await db.query('SELECT slug FROM produtos WHERE slug = ? OR slug LIKE ?', [base, `${base}-%`]);
  const usados = new Set(linhas.map((linha) => linha.slug.toLowerCase()));

  if (!usados.has(base)) return base;
  for (let n = 2; ; n += 1) {
    if (!usados.has(`${base}-${n}`)) return `${base}-${n}`;
  }
}

// ---------- leitura ----------

const SLUG_CATEGORIA = 'COALESCE(c.slug, LOWER(c.nm_categoria))';
const PRECO_FINAL = 'COALESCE(p.preco_promocional, p.preco)';

const FROM_PRODUTOS = `
    FROM produtos p
    JOIN categorias c ON c.id_categoria = p.id_categoria
    LEFT JOIN colecao col ON col.id_colecao = p.id_colecao`;

const SELECT_PRODUTOS = `
  SELECT p.id_produto AS id,
         p.slug,
         p.nm_produto AS nome,
         p.descricao,
         p.preco,
         p.preco_promocional,
         ${SLUG_CATEGORIA} AS categoria,
         col.slug AS colecao_slug,
         col.nm_colecao AS colecao_nome,
         p.imagem_url,
         p.peso_gramas
  ${FROM_PRODUTOS}`;

/** { id_produto => ['P', 'M', ...] } na ordem escolhida no painel. */
async function listasDe(db, { vinculo, tabela, id, coluna }, ids) {
  if (ids && ids.length === 0) return new Map();

  const [linhas] = await db.query(
    `SELECT v.id_produto AS produto, t.?? AS valor
       FROM ?? v
       JOIN ?? t ON t.?? = v.??
      ${ids ? 'WHERE v.id_produto IN (?)' : ''}
      ORDER BY v.id_produto, v.ordem`,
    [coluna, vinculo, tabela, id, id, ...(ids ? [ids] : [])],
  );

  const porProduto = new Map();
  for (const { produto, valor } of linhas) {
    if (!porProduto.has(produto)) porProduto.set(produto, []);
    porProduto.get(produto).push(valor);
  }
  return porProduto;
}

/** { id_produto => [{ id, tamanho, cor, estoque }] } na ordem dos tamanhos/cores do painel. */
async function variacoesDe(db, ids) {
  const porProduto = new Map();
  if (ids.length === 0) return porProduto;

  const [linhas] = await db.query(
    `SELECT v.id_variacao AS id, v.id_produto AS produto, t.sg_tamanho AS tamanho, c.nm_cor AS cor, v.estoque
       FROM produto_variacao v
       JOIN tamanho t ON t.id_tamanho = v.id_tamanho
       LEFT JOIN cores c ON c.id_cor = v.id_cor
       LEFT JOIN produto_tamanho pt ON pt.id_produto = v.id_produto AND pt.id_tamanho = v.id_tamanho
       LEFT JOIN produto_cor pc ON pc.id_produto = v.id_produto AND pc.id_cor = v.id_cor
      WHERE v.id_produto IN (?)
      ORDER BY v.id_produto, pt.ordem, pc.ordem, v.id_variacao`,
    [ids],
  );
  for (const { produto, ...variacao } of linhas) {
    if (!porProduto.has(produto)) porProduto.set(produto, []);
    porProduto.get(produto).push(variacao);
  }
  return porProduto;
}

/** { id_produto => [url, ...] } na ordem da galeria. */
async function imagensDe(db, ids) {
  const porProduto = new Map();
  if (ids.length === 0) return porProduto;

  const [linhas] = await db.query(
    'SELECT id_produto AS produto, url FROM produto_imagem WHERE id_produto IN (?) ORDER BY id_produto, ordem, id_imagem',
    [ids],
  );
  for (const { produto, url } of linhas) {
    if (!porProduto.has(produto)) porProduto.set(produto, []);
    porProduto.get(produto).push(url);
  }
  return porProduto;
}

/** { id_produto => [{ tamanho, busto_cm, ... }] } na ordem dos tamanhos do produto. Só os que têm tamanho. */
async function medidasDe(db, ids) {
  const porProduto = new Map();
  if (ids.length === 0) return porProduto;

  const [linhas] = await db.query(
    `SELECT m.id_produto AS produto, t.sg_tamanho AS tamanho, ${COLUNAS_MEDIDAS.map((c) => `m.${c}`).join(', ')}
       FROM medidas_produto m
       JOIN tamanho t ON t.id_tamanho = m.id_tamanho
       LEFT JOIN produto_tamanho pt ON pt.id_produto = m.id_produto AND pt.id_tamanho = m.id_tamanho
      WHERE m.id_produto IN (?)
      ORDER BY m.id_produto, pt.ordem, t.id_tamanho`,
    [ids],
  );
  for (const { produto, ...medidas } of linhas) {
    if (!porProduto.has(produto)) porProduto.set(produto, []);
    porProduto.get(produto).push(medidas);
  }
  return porProduto;
}

async function montarProdutos(db, linhas) {
  const ids = linhas.map((linha) => linha.id);
  const [tamanhos, cores, variacoes, imagens, medidas] = await Promise.all([
    listasDe(db, { ...TAMANHO, vinculo: 'produto_tamanho' }, ids),
    listasDe(db, { ...COR, vinculo: 'produto_cor' }, ids),
    variacoesDe(db, ids),
    imagensDe(db, ids),
    medidasDe(db, ids),
  ]);

  return linhas.map((linha) => {
    const preco = Number(linha.preco);
    const promocional = linha.preco_promocional === null ? null : Number(linha.preco_promocional);
    const galeria = imagens.get(linha.id) ?? [];

    return {
      id: linha.id,
      slug: linha.slug,
      nome: linha.nome,
      descricao: linha.descricao ?? '',
      preco, // preço normal ("de")
      preco_promocional: promocional, // null = sem promoção
      preco_final: promocional ?? preco, // o que o cliente paga
      categoria: linha.categoria,
      colecao: linha.colecao_slug ? { slug: linha.colecao_slug, nome: linha.colecao_nome } : null,
      tamanhos: tamanhos.get(linha.id) ?? [],
      cores: cores.get(linha.id) ?? [],
      variacoes: variacoes.get(linha.id) ?? [],
      estoque: (variacoes.get(linha.id) ?? []).reduce((soma, v) => soma + v.estoque, 0), // total (soma das variações)
      medidas: medidas.get(linha.id) ?? [],
      imagens: galeria,
      imagem_url: galeria[0] ?? linha.imagem_url, // capa
      peso_gramas: linha.peso_gramas,
    };
  });
}

async function buscarPorId(db, id) {
  const [linhas] = await db.query(`${SELECT_PRODUTOS} WHERE p.id_produto = ?`, [id]);
  return linhas.length ? (await montarProdutos(db, linhas))[0] : null;
}

/** Aceita o id numérico (/produtos/12, links antigos) ou o slug (/produtos/camiseta-preta). Slug tem prioridade. */
export async function findByRef(ref) {
  const [linhas] = await pool.query(
    `${SELECT_PRODUTOS} WHERE p.slug = ? OR p.id_produto = ? ORDER BY p.slug = ? DESC LIMIT 1`,
    [ref, /^\d+$/.test(ref) ? Number(ref) : -1, ref],
  );
  return linhas.length ? (await montarProdutos(pool, linhas))[0] : null;
}

export const findById = (id) => buscarPorId(pool, id);

const ORDEM_SQL = {
  recentes: 'p.id_produto DESC',
  menor_preco: `${PRECO_FINAL} ASC, p.id_produto DESC`,
  maior_preco: `${PRECO_FINAL} DESC, p.id_produto DESC`,
  nome: 'p.nm_produto ASC, p.id_produto DESC',
};

/** Escapa % e _ para o texto digitado ser buscado literalmente no LIKE. */
const literalParaLike = (texto) => texto.replace(/[\\%_]/g, (c) => `\\${c}`);

function montarFiltros({ categoria, cor, tamanho, colecao, q, em_estoque: emEstoque }) {
  const onde = [];
  const valores = [];

  if (categoria.length) {
    onde.push(`${SLUG_CATEGORIA} IN (?)`);
    valores.push(categoria);
  }
  if (colecao) {
    onde.push('col.slug = ?');
    valores.push(colecao);
  }
  // cor/tamanho: o produto precisa ter PELO MENOS UM dos valores marcados
  if (cor.length) {
    onde.push(`EXISTS (SELECT 1 FROM produto_cor pc JOIN cores co ON co.id_cor = pc.id_cor
                       WHERE pc.id_produto = p.id_produto AND co.nm_cor IN (?))`);
    valores.push(cor);
  }
  if (tamanho.length) {
    onde.push(`EXISTS (SELECT 1 FROM produto_tamanho pt JOIN tamanho t ON t.id_tamanho = pt.id_tamanho
                       WHERE pt.id_produto = p.id_produto AND t.sg_tamanho IN (?))`);
    valores.push(tamanho);
  }
  if (q) {
    onde.push("p.nm_produto LIKE ? ESCAPE '\\\\'");
    valores.push(`%${literalParaLike(q)}%`);
  }
  if (emEstoque) {
    onde.push('EXISTS (SELECT 1 FROM produto_variacao v WHERE v.id_produto = p.id_produto AND v.estoque > 0)');
  }

  return { onde: onde.length ? `WHERE ${onde.join(' AND ')}` : '', valores };
}

/**
 * Listagem paginada e filtrada NO BANCO.
 * @returns {{ itens, total, pagina, limite, paginas }}
 */
export async function list(filtros) {
  const { onde, valores } = montarFiltros(filtros);
  const { pagina, limite, ordem } = filtros;

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total ${FROM_PRODUTOS} ${onde}`, valores);
  const [linhas] = await pool.query(
    `${SELECT_PRODUTOS} ${onde} ORDER BY ${ORDEM_SQL[ordem]} LIMIT ? OFFSET ?`,
    [...valores, limite, (pagina - 1) * limite],
  );

  return {
    itens: await montarProdutos(pool, linhas),
    total,
    pagina,
    limite,
    paginas: Math.max(1, Math.ceil(total / limite)),
  };
}

/** Opções de filtro que existem de verdade nos produtos (com quantos produtos cada uma tem). */
export async function facets() {
  const [categorias] = await pool.query(
    `SELECT ${SLUG_CATEGORIA} AS slug, c.nm_categoria AS nome, COUNT(p.id_produto) AS total
       FROM categorias c JOIN produtos p ON p.id_categoria = c.id_categoria
      GROUP BY c.id_categoria ORDER BY c.nm_categoria`,
  );
  const [cores] = await pool.query(
    `SELECT co.nm_cor AS nome, COUNT(DISTINCT pc.id_produto) AS total
       FROM produto_cor pc JOIN cores co ON co.id_cor = pc.id_cor
      GROUP BY co.id_cor ORDER BY co.nm_cor`,
  );
  const [tamanhos] = await pool.query(
    `SELECT t.sg_tamanho AS nome, COUNT(DISTINCT pt.id_produto) AS total
       FROM produto_tamanho pt JOIN tamanho t ON t.id_tamanho = pt.id_tamanho
      GROUP BY t.id_tamanho ORDER BY t.id_tamanho`,
  );
  const num = (linhas) => linhas.map((l) => ({ ...l, total: Number(l.total) }));
  return { categorias: num(categorias), cores: num(cores), tamanhos: num(tamanhos) };
}

// ---------- escrita ----------

export async function create(data) {
  for (let tentativa = 1; ; tentativa += 1) {
    try {
      return await comTransacao(async (db) => {
        const [resultado] = await db.query(
          `INSERT INTO produtos
             (id_categoria, id_colecao, nm_produto, slug, descricao, preco, preco_promocional, peso_gramas)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            await idDaCategoria(db, data.categoria),
            await idDaColecao(db, data.colecao),
            data.nome,
            await slugUnico(db, data.nome),
            data.descricao || null,
            data.preco,
            data.preco_promocional,
            data.peso_gramas,
          ],
        );

        await gravarOpcoes(db, resultado.insertId, data);
        return buscarPorId(db, resultado.insertId);
      });
    } catch (erro) {
      // Duas requisições escolheram o mesmo slug ao mesmo tempo: tenta de novo com o próximo livre.
      if (erro.code === 'ER_DUP_ENTRY' && tentativa < 3) continue;
      throw erro;
    }
  }
}

/** Retorna o produto atualizado, ou null se o id não existir. (O slug não muda ao editar.) */
export async function update(id, data) {
  let removidas = [];

  const produto = await comTransacao(async (db) => {
    const [existe] = await db.query('SELECT id_produto FROM produtos WHERE id_produto = ? FOR UPDATE', [id]);
    if (existe.length === 0) return null;

    await db.query(
      `UPDATE produtos
          SET id_categoria = ?, id_colecao = ?, nm_produto = ?, descricao = ?, preco = ?,
              preco_promocional = ?, peso_gramas = ?
        WHERE id_produto = ?`,
      [
        await idDaCategoria(db, data.categoria),
        await idDaColecao(db, data.colecao),
        data.nome,
        data.descricao || null,
        data.preco,
        data.preco_promocional,
        data.peso_gramas,
        id,
      ],
    );

    removidas = await gravarOpcoes(db, id, data);
    return buscarPorId(db, id);
  });

  if (produto) await apagarImagensSemUso(removidas); // só depois do commit
  return produto;
}

/** Retorna true se removeu, false se o id não existia. */
export async function remove(id) {
  let imagens = [];

  try {
    const removido = await comTransacao(async (db) => {
      const [antigas] = await db.query('SELECT url FROM produto_imagem WHERE id_produto = ?', [id]);
      const [capas] = await db.query('SELECT imagem_url FROM produtos WHERE id_produto = ?', [id]);
      const capa = capas[0];
      imagens = [...new Set([...antigas.map((l) => l.url), capa?.imagem_url].filter(Boolean))];

      await db.query('DELETE FROM medidas_produto WHERE id_produto = ?', [id]);
      // produto_tamanho, produto_cor, produto_variacao e produto_imagem saem junto (ON DELETE CASCADE).
      const [resultado] = await db.query('DELETE FROM produtos WHERE id_produto = ?', [id]);
      return resultado.affectedRows > 0;
    });

    if (removido) await apagarImagensSemUso(imagens);
    return removido;
  } catch (erro) {
    // Produto que já está em carrinho ou pedido não pode sumir (chave estrangeira).
    if (erro.code === 'ER_ROW_IS_REFERENCED_2') {
      throw new HttpError(409, 'Este produto está em carrinhos ou pedidos e não pode ser excluído.');
    }
    throw erro;
  }
}
