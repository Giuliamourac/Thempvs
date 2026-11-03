
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';


const NOME_LOCAL = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg|png|gif)$/;

const local = {
  async salvar(buffer, { extensao }, { baseUrl }) {
    const nome = `${randomUUID()}.${extensao}`;
    await mkdir(env.uploadDir, { recursive: true });
    await writeFile(path.join(env.uploadDir, nome), buffer);
    return `${env.publicUrl || baseUrl}/uploads/${nome}`;
  },

  async remover(url) {
    let caminho;
    try {
      caminho = new URL(url, 'http://localhost').pathname;
    } catch {
      return false;
    }
    const nome = caminho.startsWith('/uploads/') ? caminho.slice('/uploads/'.length) : '';
    if (!NOME_LOCAL.test(nome)) return false; 
    await unlink(path.join(env.uploadDir, nome)).catch((erro) => {
      if (erro.code !== 'ENOENT') throw erro;
    });
    return true;
  },
};



let clienteS3;
async function s3() {
  if (!clienteS3) {
    const { S3Client } = await import('@aws-sdk/client-s3');
    clienteS3 = new S3Client({
      region: env.s3.regiao,
      endpoint: env.s3.endpoint || undefined,
      forcePathStyle: env.s3.pathStyle,
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
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
    return `${env.s3.urlPublica}/${chave}`;
  },

  async remover(url) {
    const prefixo = `${env.s3.urlPublica}/${env.s3.prefixo}`;
    if (!url.startsWith(prefixo)) return false;
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    await (await s3()).send(new DeleteObjectCommand({ Bucket: env.s3.bucket, Key: url.slice(env.s3.urlPublica.length + 1) }));
    return true;
  },
};

const driver = () => (env.storage === 's3' ? s3Driver : local);

export const salvarImagem = (buffer, tipo, contexto) => driver().salvar(buffer, tipo, contexto);

export const removerImagem = (url) => driver().remover(url);
