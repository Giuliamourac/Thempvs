/**
 * Testa o storage de imagens configurado no .env (STORAGE_DRIVER), sem precisar abrir o site:
 *
 *   npm run storage:test
 *
 * Envia uma imagem pequena, abre a URL pública para conferir que ela é acessível e depois apaga.
 */
import { env } from '../src/config/env.js';
import { processarImagem } from '../src/services/imagens.js';
import { removerImagem, salvarImagem } from '../src/services/storage.js';
import sharp from 'sharp';

console.log(`STORAGE_DRIVER=${env.storage}`);
if (env.storage === 's3') {
  const faltando = ['bucket', 'chaveId', 'chaveSecreta', 'urlPublica'].filter((c) => !env.s3[c]);
  if (faltando.length) {
    console.error(`Faltam variáveis no .env: ${faltando.map((c) => ({ bucket: 'S3_BUCKET', chaveId: 'S3_ACCESS_KEY_ID', chaveSecreta: 'S3_SECRET_ACCESS_KEY', urlPublica: 'S3_PUBLIC_URL' })[c]).join(', ')}`);
    process.exit(1);
  }
}

const png = await sharp({ create: { width: 64, height: 64, channels: 3, background: '#2a7' } }).png().toBuffer();
const imagem = await processarImagem(png);

let url;
try {
  url = await salvarImagem(imagem.buffer, imagem, { baseUrl: `http://localhost:${env.port ?? 3000}` });
  console.log('1) Envio OK  ->', url);
} catch (erro) {
  console.error('1) FALHOU ao enviar:', erro.name, '-', erro.message);
  console.error('   Confira S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID e S3_SECRET_ACCESS_KEY (e se o token tem permissão de escrita no bucket).');
  process.exit(1);
}

if (env.storage === 's3') {
  try {
    const resposta = await fetch(url);
    const tipo = resposta.headers.get('content-type');
    if (resposta.ok) console.log(`2) Leitura pública OK (${resposta.status}, ${tipo})`);
    else console.error(`2) FALHOU ao abrir a URL pública (HTTP ${resposta.status}). O bucket está com acesso público ligado? O S3_PUBLIC_URL está certo?`);
  } catch (erro) {
    console.error('2) FALHOU ao abrir a URL pública:', erro.message);
  }
}

try {
  await removerImagem(url);
  console.log('3) Remoção OK (arquivo de teste apagado)');
} catch (erro) {
  console.error('3) FALHOU ao remover:', erro.message, '— o token precisa de permissão de escrita (Object Read & Write).');
  process.exit(1);
}
