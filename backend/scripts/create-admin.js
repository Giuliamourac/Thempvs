/**
 * Cria (ou promove) um usuário administrador.
 *
 *   npm run admin:create
 *
 * Pergunta nome, email e senha. Se o email já existir, a conta vira admin e a senha é trocada.
 * Também aceita variáveis de ambiente (útil em scripts):
 *   ADMIN_NAME="Fulano" ADMIN_EMAIL=fulano@loja.com ADMIN_PASSWORD='uma-senha-forte' npm run admin:create
 */
import readline from 'node:readline';
import bcrypt from 'bcryptjs';
import { pool } from '../src/config/db.js';
import { registerSchema } from '../src/validators/auth.schema.js';

const BCRYPT_COST = 12;

function perguntar(pergunta, { oculto = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (oculto) {
      // Não ecoa a senha na tela.
      rl._writeToOutput = (texto) => {
        if (texto.startsWith(pergunta)) rl.output.write(pergunta);
      };
    }
    rl.question(pergunta, (resposta) => {
      rl.close();
      if (oculto) process.stdout.write('\n');
      resolve(resposta);
    });
  });
}

const nome = process.env.ADMIN_NAME || (await perguntar('Nome: '));
const email = process.env.ADMIN_EMAIL || (await perguntar('Email: '));
const senha = process.env.ADMIN_PASSWORD || (await perguntar('Senha (mín. 8 caracteres): ', { oculto: true }));

const dados = registerSchema.safeParse({ nome, email, senha });
if (!dados.success) {
  console.error('\nDados inválidos:');
  for (const erro of dados.error.issues) console.error(` - ${erro.message}`);
  process.exit(1);
}

try {
  const { nome: n, email: e, senha: s } = dados.data;
  const hash = await bcrypt.hash(s, BCRYPT_COST);

  const [existente] = await pool.query('SELECT id_usuario FROM usuario WHERE ds_email = ?', [e]);
  if (existente.length) {
    await pool.query(
      "UPDATE usuario SET perfil = 'admin', ativo = 1, senha_hash = ?, nm_usuario = ? WHERE id_usuario = ?",
      [hash, n, existente[0].id_usuario],
    );
    console.log(`\nA conta ${e} já existia: agora é administradora e a senha foi atualizada.`);
  } else {
    await pool.query(
      "INSERT INTO usuario (nm_usuario, ds_email, senha_hash, perfil) VALUES (?, ?, ?, 'admin')",
      [n, e, hash],
    );
    console.log(`\nAdministrador ${e} criado. Entre em http://localhost:5173/entrar`);
  }
} catch (erro) {
  console.error('\nNão foi possível gravar no banco:', erro.code ?? erro.message);
  console.error('Confira o backend/.env e rode `npm run db:init` antes.');
  process.exitCode = 1;
} finally {
  await pool.end();
}
