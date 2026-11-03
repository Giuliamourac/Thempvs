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

try {
  await checkConnection();
  console.log(`MySQL conectado em ${env.db.host}:${env.db.port}/${env.db.database}`);
} catch (error) {
  console.error('\nNão foi possível conectar ao MySQL:', error.code ?? error.message);
  console.error('Confira o arquivo backend/.env, se o MySQL está rodando e se o banco foi criado (npm run db:init).\n');
  process.exit(1);
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
