import mysql from 'mysql2/promise';
import { env } from './env.js';

/**
 * Pool de conexões compartilhado por toda a aplicação.
 * - decimalNumbers: colunas DECIMAL (preço) voltam como number, não string.
 * - Todas as consultas usam placeholders (?) — nunca concatene valores no SQL.
 */
export const pool = mysql.createPool({
  ...env.db,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  decimalNumbers: true,
  // Colunas DATE (data de entrega) voltam como 'AAAA-MM-DD'; como objeto Date o fuso mudaria o dia.
  dateStrings: ['DATE'],
});

/** Executa `fn(conexao)` numa transação (commit se der certo, rollback se der erro). */
export async function withTransaction(fn) {
  const conexao = await pool.getConnection();
  try {
    await conexao.beginTransaction();
    const resultado = await fn(conexao);
    await conexao.commit();
    return resultado;
  } catch (erro) {
    await conexao.rollback().catch(() => {});
    throw erro;
  } finally {
    conexao.release();
  }
}

export async function checkConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
}
