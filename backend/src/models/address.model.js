import { pool, withTransaction } from '../config/db.js';
import { HttpError } from '../utils/httpError.js';

const COLUNAS = `id_endereco AS id, destinatario, cep, ds_rua AS rua, nmr_casa AS numero,
                 ds_complemento AS complemento, nm_bairro AS bairro, nm_cidade AS cidade, uf, padrao`;

const toAddress = (row) => ({ ...row, padrao: Boolean(row.padrao) });

export async function listByUser(userId) {
  const [rows] = await pool.query(
    `SELECT ${COLUNAS} FROM enderecos WHERE id_usuario = ? ORDER BY padrao DESC, id_endereco DESC`,
    [userId],
  );
  return rows.map(toAddress);
}

export async function findOwned(db, userId, id) {
  const [rows] = await db.query(`SELECT ${COLUNAS} FROM enderecos WHERE id_endereco = ? AND id_usuario = ?`, [id, userId]);
  return rows[0] ? toAddress(rows[0]) : null;
}

export function create(userId, data) {
  return withTransaction(async (db) => {
    const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM enderecos WHERE id_usuario = ? FOR UPDATE', [userId]);
    const padrao = data.padrao || total === 0;
    if (padrao) await db.query('UPDATE enderecos SET padrao = 0 WHERE id_usuario = ?', [userId]);

    const [resultado] = await db.query(
      `INSERT INTO enderecos
         (id_usuario, destinatario, cep, ds_rua, nmr_casa, ds_complemento, nm_bairro, nm_cidade, uf, padrao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, data.destinatario, data.cep, data.rua, data.numero, data.complemento, data.bairro, data.cidade, data.uf, padrao],
    );
    return findOwned(db, userId, resultado.insertId);
  });
}

export async function remove(userId, id) {
  try {
    const [resultado] = await pool.query('DELETE FROM enderecos WHERE id_endereco = ? AND id_usuario = ?', [id, userId]);
    return resultado.affectedRows > 0;
  } catch (erro) {
    if (erro.code === 'ER_ROW_IS_REFERENCED_2') {
      throw new HttpError(409, 'Este endereço foi usado em um pedido e não pode ser excluído.');
    }
    throw erro;
  }
}
