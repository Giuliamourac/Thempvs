import app from './app.js';
import { env } from './config/env.js';
import { checkConnection, pool } from './config/db.js';

if (env.jwtSecret.length < 32) {
  console.error('\nJWT_SECRET ausente ou curto demais (mínimo de 32 caracteres) no backend/.env.');
  console.error('Para gerar e gravar um automaticamente, rode (em qualquer sistema):\n');
  console.error('  npm run gen:secret\n');
  process.exit(1);
}

if (env.storage === 's3') {
  const faltando = ['bucket', 'chaveId', 'chaveSecreta', 'urlPublica'].filter((campo) => !env.s3[campo]);
  if (faltando.length) {
    console.error('\nSTORAGE_DRIVER=s3 mas faltam variáveis no backend/.env: S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY e S3_PUBLIC_URL.\n');
    process.exit(1);
  }
}

// O banco pode estar acordando (Aiven/Render grátis) ou o DNS pode falhar por um instante:
// tenta algumas vezes antes de desistir, em vez de encerrar na primeira falha.
const TENTATIVAS_BANCO = 8;
const ESPERA_BANCO_MS = 5000;
const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

for (let tentativa = 1; ; tentativa += 1) {
  try {
    await checkConnection();
    console.log(`MySQL conectado em ${env.db.host}:${env.db.port}/${env.db.database}`);
    break;
  } catch (error) {
    const motivo = error.code ?? error.message;
    if (tentativa >= TENTATIVAS_BANCO) {
      console.error('\nNão foi possível conectar ao MySQL:', motivo);
      console.error('Confira o arquivo backend/.env, se o MySQL está rodando (no Aiven: serviço "Running") e se o banco foi criado (npm run db:init).\n');
      process.exit(1);
    }
    console.warn(`MySQL indisponível (${motivo}). Tentativa ${tentativa}/${TENTATIVAS_BANCO}; nova tentativa em ${ESPERA_BANCO_MS / 1000}s...`);
    await esperar(ESPERA_BANCO_MS);
  }
}

const server = app.listen(env.port, () => {
  console.log(`API rodando em http://localhost:${env.port}/api (imagens: ${env.storage})`);
});

async function shutdown() {
  server.close();
  await pool.end();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
