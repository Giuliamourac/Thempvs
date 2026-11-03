/**
 * Gera um JWT_SECRET seguro e grava no backend/.env (funciona em Windows, Mac e Linux).
 *
 *   npm run gen:secret
 *
 * - Se o .env não existir, cria a partir do .env.example.
 * - Se já houver um JWT_SECRET válido, NÃO troca (trocar desloga todo mundo).
 *   Para forçar a troca: npm run gen:secret -- --force
 */
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const envPath = fileURLToPath(new URL('../.env', import.meta.url));
const examplePath = fileURLToPath(new URL('../.env.example', import.meta.url));
const forcar = process.argv.includes('--force');

let conteudo;
if (existsSync(envPath)) {
  conteudo = await readFile(envPath, 'utf8');
} else {
  conteudo = await readFile(examplePath, 'utf8');
  console.log('Arquivo .env não existia: criado a partir do .env.example (confira DB_USER e DB_PASSWORD).');
}

const atual = /^JWT_SECRET=(.*)$/m.exec(conteudo)?.[1].trim() ?? '';
if (atual.length >= 32 && !forcar) {
  console.log('O .env já tem um JWT_SECRET válido. Nada foi alterado (use --force para trocar).');
  process.exit(0);
}

const segredo = randomBytes(48).toString('hex');
const linha = `JWT_SECRET=${segredo}`;
conteudo = /^JWT_SECRET=.*$/m.test(conteudo)
  ? conteudo.replace(/^JWT_SECRET=.*$/m, () => linha)
  : `${conteudo.replace(/\s*$/, '\n')}${linha}\n`;

await writeFile(envPath, conteudo);
console.log('JWT_SECRET gerado e salvo em backend/.env. Agora é só rodar: npm run dev');
