/** Categorias e coleções vindas do banco (as opções que o painel e a vitrine mostram). */
import { pool } from '../config/db.js';
import { HttpError } from '../utils/httpError.js';
import { slugify } from '../utils/slug.js';

const numero = (linhas) => linhas.map((l) => ({ ...l, total_produtos: Number(l.total_produtos) }));

export async function listarCategorias() {
  const [linhas] = await pool.query(
    `SELECT COALESCE(c.slug, LOWER(c.nm_categoria)) AS slug, c.nm_categoria AS nome,
            COUNT(p.id_produto) AS total_produtos
       FROM categorias c LEFT JOIN produtos p ON p.id_categoria = c.id_categoria
      GROUP BY c.id_categoria ORDER BY c.nm_categoria`,
  );
  return numero(linhas);
}

export async function listarColecoes() {
  const [linhas] = await pool.query(
    `SELECT col.slug, col.nm_colecao AS nome, col.descricao, COUNT(p.id_produto) AS total_produtos
       FROM colecao col LEFT JOIN produtos p ON p.id_colecao = col.id_colecao
      WHERE col.ativa = TRUE AND col.slug IS NOT NULL
      GROUP BY col.id_colecao ORDER BY col.nm_colecao`,
  );
  return numero(linhas);
}

async function criar({ tabela, id, colNome, colSlug }, nome, extras = {}) {
  const slug = slugify(nome);
  if (!slug) throw new HttpError(400, 'Dados inválidos.', [{ campo: 'nome', mensagem: 'Nome inválido.' }]);

  const [existe] = await pool.query('SELECT ?? AS id FROM ?? WHERE ?? = ? OR ?? = ? LIMIT 1', [id, tabela, colSlug, slug, colNome, nome]);
  if (existe.length) throw new HttpError(409, 'Já existe um item com esse nome.');

  await pool.query('INSERT INTO ?? SET ?', [tabela, { [colNome]: nome, [colSlug]: slug, ...extras }]);
  return { slug, nome, total_produtos: 0 };
}

export const criarCategoria = (nome) =>
  criar({ tabela: 'categorias', id: 'id_categoria', colNome: 'nm_categoria', colSlug: 'slug' }, nome);

export const criarColecao = (nome, descricao) =>
  criar({ tabela: 'colecao', id: 'id_colecao', colNome: 'nm_colecao', colSlug: 'slug' }, nome, {
    descricao: descricao || null,
    ativa: true,
  });
