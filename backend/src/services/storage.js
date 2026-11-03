/**
 * Onde as imagens ficam guardadas. Dois "drivers", escolhidos por STORAGE_DRIVER no .env:
 *
 *   local (padrão)  pasta backend/uploads, servida em /uploads (ótimo para desenvolvimento;
 *                   em hospedagem com disco efêmero, os arquivos somem a cada deploy)
 *   s3              qualquer serviço compatível com S3: AWS S3, Cloudflare R2, Backblaze B2,
 *                   DigitalOcean Spaces, Supabase Storage, MinIO...
 *
 * O resto do sistema só usa `salvarImagem` e `removerImagem` — trocar de driver não muda mais nada.
 * O que vai para o banco é sempre a URL pública da imagem.
 */
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';

// ---------- local ----------

const NOME_LOCAL = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg|png|gif)$/;

const local = {
  async salvar(buffer, { extensao }, { baseUrl }) {
    const nome = `${randomUUID()}.${extensao}`;
    await mkdir(env.uploadDir, { recursive: true });
    await writeFile(path.join(env.uploadDir, nome), buffer);
    return `${env.publicUrl || baseUrl}/uploads/${nome}`;
  },

  /** true se a URL era uma imagem nossa (e foi apagada ou já não existia). */
  async remover(url) {
    let caminho;
    try {
      caminho = new URL(url, 'http://localhost').pathname;
    } catch {
      return false;
    }
    const nome = caminho.startsWith('/uploads/') ? caminho.slice('/uploads/'.length) : '';
    if (!NOME_LOCAL.test(nome)) return false; // só nomes gerados por nós: nunca sai da pasta uploads
    await unlink(path.join(env.uploadDir, nome)).catch((erro) => {
      if (erro.code !== 'ENOENT') throw erro;
    });
    return true;
  },
};

// ---------- s3 (carregado só quando usado) ----------

let clienteS3;
async function s3() {
  if (!clienteS3) {
    const { S3Client } = await import('@aws-sdk/client-s3');
    clienteS3 = new S3Client({
      region: env.s3.regiao,
      endpoint: env.s3.endpoint || undefined,
      forcePathStyle: env.s3.pathStyle,
      // Versões novas do SDK mandam checksums extras por padrão, e vários serviços compatíveis
      // (Backblaze B2, MinIO antigo...) recusam. Só calcula quando o serviço exige.
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
      credentials: { accessKeyId: env.s3.chaveId, secretAccessKey: env.s3.chaveSecreta },
    });
  }
  return clienteS3;
}

const s3Driver = {
  async salvar(buffer, { extensao, contentType }) {
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    const chave = `${env.s3.prefixo}${randomUUID()}.${extensao}`;
    await (await s3()).send(
      new PutObjectCommand({
        Bucket: env.s3.bucket,
        Key: chave,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable', // nome único: nunca muda
      }),
    );
    return `${env.s3.urlPublica}/${chave}`;
  },

  async remover(url) {
    const prefixo = `${env.s3.urlPublica}/${env.s3.prefixo}`;
    if (!url.startsWith(prefixo)) return false; // não é nossa
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    await (await s3()).send(new DeleteObjectCommand({ Bucket: env.s3.bucket, Key: url.slice(env.s3.urlPublica.length + 1) }));
    return true;
  },
};

const driver = () => (env.storage === 's3' ? s3Driver : local);

/** Grava a imagem já processada e devolve a URL pública. `baseUrl` = endereço desta API (driver local). */
export const salvarImagem = (buffer, tipo, contexto) => driver().salvar(buffer, tipo, contexto);

/** Apaga uma imagem nossa. Nunca lança por URL de fora (retorna false): só tenta apagar o que é do nosso storage. */
export const removerImagem = (url) => driver().remover(url);
