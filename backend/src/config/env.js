import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const list = (value, fallback) =>
  (value ?? fallback)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

/**
 * Conexão criptografada com o MySQL (exigida por serviços em nuvem como o Aiven).
 *   DB_SSL=true        liga o SSL e confere o certificado do servidor
 *   DB_SSL=no-verify   liga o SSL sem conferir o certificado (criptografa, mas não garante QUEM está do outro lado)
 *   DB_SSL_CA          certificado da autoridade (CA) do provedor: o TEXTO (-----BEGIN CERTIFICATE-----...)
 *                      ou o caminho de um arquivo .pem. O Aiven fornece esse arquivo no painel do serviço.
 * Sem DB_SSL, a conexão é a de sempre (sem SSL), como no MySQL local.
 */
function sslDoBanco() {
  const modo = (process.env.DB_SSL ?? '').toLowerCase();
  if (!modo || modo === 'false' || modo === '0') return undefined;
  if (modo === 'no-verify') return { rejectUnauthorized: false };

  const ca = process.env.DB_SSL_CA?.trim();
  if (!ca) return { rejectUnauthorized: true };
  const texto = ca.includes('-----BEGIN') ? ca.replace(/\\n/g, '\n') : readFileSync(ca, 'utf8');
  return { rejectUnauthorized: true, ca: texto };
}

export const env = {
  port: Number(process.env.PORT) || 3000,
  // Pasta onde as imagens enviadas pelo painel são gravadas (servida em /uploads).
  uploadDir: fileURLToPath(new URL('../../uploads', import.meta.url)),
  // Onde guardar as imagens: 'local' (pasta uploads) ou 's3' (qualquer serviço compatível com S3).
  storage: process.env.STORAGE_DRIVER === 's3' ? 's3' : 'local',
  s3: {
    bucket: process.env.S3_BUCKET ?? '',
    regiao: process.env.S3_REGION || 'auto',
    // Vazio na AWS; preencha em R2/B2/Spaces/MinIO (ex.: https://<conta>.r2.cloudflarestorage.com).
    endpoint: process.env.S3_ENDPOINT ?? '',
    chaveId: process.env.S3_ACCESS_KEY_ID ?? '',
    chaveSecreta: process.env.S3_SECRET_ACCESS_KEY ?? '',
    // Endereço público de leitura das imagens (domínio do bucket ou da CDN), sem barra no fim.
    urlPublica: (process.env.S3_PUBLIC_URL ?? '').replace(/\/$/, ''),
    pathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    // Pasta dentro do bucket (com barra no fim), ex.: "produtos/".
    prefixo: (process.env.S3_PREFIX ?? 'produtos/').replace(/^\/+/, '').replace(/([^/])$/, '$1/'),
  },
  // Processamento das imagens enviadas.
  imagem: {
    ladoMaximo: Number(process.env.IMAGE_MAX_PX) || 1600,
    qualidade: Math.min(100, Math.max(40, Number(process.env.IMAGE_QUALITY) || 82)),
  },
  // Endereço público da API, usado para montar a URL das imagens (padrão: o host da requisição).
  publicUrl: process.env.PUBLIC_URL?.replace(/\/$/, '') || '',
  // Segredo que assina os tokens de login (JWT). OBRIGATÓRIO: mínimo de 32 caracteres.
  jwtSecret: process.env.JWT_SECRET ?? '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  // Atrás de proxy/Nginx/Heroku: "1" (um proxy) ou "true". Necessário para o limite de tentativas ver o IP real.
  trustProxy: process.env.TRUST_PROXY ? (process.env.TRUST_PROXY === 'true' ? true : Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY) : false,
  // Frete grátis (serviço padrão) a partir deste subtotal, em reais.
  freteGratisAPartirDe: Number(process.env.FRETE_GRATIS_A_PARTIR) || 199.9,
  corsOrigins: list(process.env.CORS_ORIGIN, 'http://localhost:5173,http://127.0.0.1:5173'),
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'thempvs',
    ssl: sslDoBanco(),
  },
};
