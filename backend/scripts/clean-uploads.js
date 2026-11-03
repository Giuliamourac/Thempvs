/**
 * Apaga de backend/uploads os arquivos que nenhum produto usa mais (órfãos).
 *
 *   npm run uploads:clean            # só lista o que seria apagado
 *   npm run uploads:clean -- --apply # apaga de verdade
 *
 * Só olha o storage local. Arquivos com menos de 1 hora são ignorados (podem ser um upload
 * recém-feito, ainda não salvo em nenhum produto).
 */
import { readdir, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import mysql from 'mysql2/promise';
import { env } from '../src/config/env.js';

const aplicar = process.argv.includes('--apply');
const UMA_HORA = 60 * 60 * 1000;

if (env.storage !== 'local') {
  console.log('STORAGE_DRIVER não é "local": use a ferramenta do seu provedor (ou lifecycle rules) para o bucket.');
  process.exit(0);
}

const db = await mysql.createConnection(env.db);
try {
  const [linhas] = await db.query(
    `SELECT url FROM produto_imagem UNION SELECT imagem_url FROM produtos WHERE imagem_url IS NOT NULL`,
  );
  const emUso = new Set(linhas.map((l) => path.posix.basename(new URL(l.url, 'http://x').pathname)));

  let arquivos = [];
  try {
    arquivos = await readdir(env.uploadDir);
  } catch {
    console.log('Pasta de uploads não existe; nada a fazer.');
  }

  let orfaos = 0;
  for (const nome of arquivos) {
    if (nome.startsWith('.') || emUso.has(nome)) continue;
    const caminho = path.join(env.uploadDir, nome);
    const info = await stat(caminho);
    if (!info.isFile() || Date.now() - info.mtimeMs < UMA_HORA) continue;
    orfaos += 1;
    console.log(`${aplicar ? 'apagado' : 'órfão'}: ${nome}`);
    if (aplicar) await unlink(caminho);
  }
  console.log(`${orfaos} arquivo(s) órfão(s).${!aplicar && orfaos ? ' Rode com --apply para apagar.' : ''}`);
} finally {
  await db.end();
}
