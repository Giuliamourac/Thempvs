import { pool } from '../config/db.js';
import { HttpError } from '../utils/httpError.js';

const toUser = (row) => ({
  id: row.id,
  nome: row.nome,
  email: row.email,
  telefone: row.telefone,
  perfil: row.perfil,
});

const COLUNAS = `id_usuario AS id, nm_usuario AS nome, ds_email AS email, telefone, perfil, ativo`;

/** Linha completa (com hash) — só para conferir a senha no login. */
export async function findForLogin(email) {
  const [rows] = await pool.query(`SELECT ${COLUNAS}, senha_hash FROM usuario WHERE ds_email = ? LIMIT 1`, [email]);
  return rows[0] ?? null;
}

/** Usuário ativo, sem o hash. Retorna null se não existir ou estiver desativado. */
export async function findActiveById(id) {
  const [rows] = await pool.query(`SELECT ${COLUNAS} FROM usuario WHERE id_usuario = ? AND ativo = 1`, [id]);
  return rows[0] ? toUser(rows[0]) : null;
}

/** Cadastro público: o perfil é SEMPRE 'cliente' (admin só é criado por `npm run admin:create`). */
export async function createCustomer({ nome, email, senhaHash, telefone }) {
  try {
    const [resultado] = await pool.query(
      `INSERT INTO usuario (nm_usuario, ds_email, senha_hash, telefone, perfil) VALUES (?, ?, ?, ?, 'cliente')`,
      [nome, email, senhaHash, telefone],
    );
    return findActiveById(resultado.insertId);
  } catch (erro) {
    if (erro.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'Este email já está cadastrado.');
    throw erro;
  }
}

export const toPublicUser = toUser;
