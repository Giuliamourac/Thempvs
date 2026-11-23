/**
 * Confere o resultado do build (dist/) — rode depois de `npm run build`:  npm run seo:check
 * Falha (exit 1) se algo essencial de SEO estiver errado.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGINAS_PUBLICAS, SITE_URL } from '../src/seo/siteConfig.js';

const DIST = join(resolve(dirname(fileURLToPath(import.meta.url)), '..'), 'dist');
const erros = [];
const ok = (cond, msg) => {
  if (!cond) erros.push(msg);
};

const html = (arquivo) => readFileSync(join(DIST, arquivo), 'utf8');
const pegar = (texto, regex) => texto.match(regex)?.[1];

// 1) HTMLs públicos
const publicos = [...PAGINAS_PUBLICAS.map((p) => p.arquivo)];
const pastaProdutos = join(DIST, 'produtos');
if (existsSync(pastaProdutos)) {
  for (const f of readdirSync(pastaProdutos)) if (f.endsWith('.html')) publicos.push(`produtos/${f}`);
}
const titulos = new Map();
const canonicos = new Map();
for (const arquivo of publicos) {
  ok(existsSync(join(DIST, arquivo)), `${arquivo}: arquivo não gerado`);
  if (!existsSync(join(DIST, arquivo))) continue;
  const h = html(arquivo);
  const title = pegar(h, /<title>([^<]+)<\/title>/);
  const desc = pegar(h, /<meta name="description" content="([^"]+)"/);
  const canon = pegar(h, /<link rel="canonical" href="([^"]+)"/);
  const robots = pegar(h, /<meta name="robots" content="([^"]+)"/);
  ok(title, `${arquivo}: sem <title>`);
  ok(title && title.length <= 70, `${arquivo}: título longo demais (${title?.length})`);
  ok(desc && desc.length >= 50 && desc.length <= 170, `${arquivo}: descrição fora de 50–170 caracteres (${desc?.length})`);
  ok(canon && canon.startsWith(`${SITE_URL}/`) || canon === SITE_URL, `${arquivo}: canonical ausente/fora do domínio (${canon})`);
  ok(robots && !/noindex/i.test(robots), `${arquivo}: robots com noindex ou ausente`);
  ok(/property="og:title"/.test(h) && /property="og:image"/.test(h) && /property="og:url"/.test(h), `${arquivo}: Open Graph incompleto`);
  ok(/<h1>/.test(h), `${arquivo}: sem <h1> no <noscript>`);
  ok(/<div id="root"><\/div>/.test(h) && /type="module"/.test(h), `${arquivo}: app React não está presente`);
  ok(/application\/ld\+json/.test(h) || arquivo.startsWith('quem-usa') || ['sale.html', 'movement.html'].includes(arquivo), `${arquivo}: sem JSON-LD`);
  if (title) titulos.set(title, [...(titulos.get(title) ?? []), arquivo]);
  if (canon) canonicos.set(canon, [...(canonicos.get(canon) ?? []), arquivo]);
}
for (const [t, arqs] of titulos) ok(arqs.length === 1, `título repetido "${t}": ${arqs.join(', ')}`);
for (const [c, arqs] of canonicos) ok(arqs.length === 1, `canonical repetido ${c}: ${arqs.join(', ')}`);

// 2) Cascas noindex
for (const arquivo of ['private.html', '404.html']) {
  ok(existsSync(join(DIST, arquivo)), `${arquivo}: não gerado`);
  if (existsSync(join(DIST, arquivo))) {
    const h = html(arquivo);
    ok(/<meta name="robots" content="noindex, nofollow"/.test(h), `${arquivo}: precisa de noindex`);
    ok(!/rel="canonical"/.test(h), `${arquivo}: não deve ter canonical`);
  }
}
ok(existsSync(join(DIST, 'app.html')), 'app.html: não gerado');

// 3) robots.txt
ok(existsSync(join(DIST, 'robots.txt')), 'robots.txt ausente em dist/');
if (existsSync(join(DIST, 'robots.txt'))) {
  const r = readFileSync(join(DIST, 'robots.txt'), 'utf8');
  ok(/^User-agent: \*/m.test(r), 'robots.txt sem User-agent');
  ok(!/^Disallow:\s*\/\s*$/m.test(r), 'robots.txt bloqueia o site inteiro!');
  ok(r.includes(`Sitemap: ${SITE_URL}/sitemap.xml`), 'robots.txt sem a linha Sitemap correta');
  for (const rota of ['/admin', '/carrinho', '/entrar', '/cadastrar', '/perfil', '/pedidos'])
    ok(new RegExp(`^Disallow: ${rota}$`, 'm').test(r), `robots.txt deveria bloquear ${rota}`);
}

// 4) sitemap.xml
ok(existsSync(join(DIST, 'sitemap.xml')), 'sitemap.xml ausente em dist/');
if (existsSync(join(DIST, 'sitemap.xml'))) {
  const s = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
  const locs = [...s.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'));
  ok(locs.length >= PAGINAS_PUBLICAS.length, 'sitemap com poucas URLs');
  ok(new Set(locs).size === locs.length, 'sitemap tem URLs duplicadas');
  for (const loc of locs) {
    ok(loc.startsWith(`${SITE_URL}/`), `sitemap: URL fora do domínio ${loc}`);
    ok(!/\/(admin|carrinho|entrar|cadastrar|perfil|pedidos|lojas)(\/|$|\?)/.test(loc), `sitemap: URL privada ${loc}`);
    const caminho = new URL(loc).pathname;
    const arquivo = caminho === '/' ? 'index.html' : `${caminho.slice(1)}.html`;
    ok(existsSync(join(DIST, arquivo)), `sitemap: ${loc} não tem HTML estático (${arquivo})`);
  }
  for (const p of PAGINAS_PUBLICAS) ok(locs.includes(`${SITE_URL}${p.path === '/' ? '/' : p.path}`), `sitemap sem ${p.path}`);
}

// 5) imagens usadas nos metadados existem
for (const img of ['og-image.jpg', 'logo.png', 'favicon.ico', 'apple-touch-icon.png']) ok(existsSync(join(DIST, img)), `${img} ausente em dist/`);

// 6) nenhum noindex acidental nos arquivos públicos / fonte
const index = html('index.html');
ok(!/noindex/i.test(index), 'index.html não pode ter noindex');

if (erros.length) {
  console.error(`✗ ${erros.length} problema(s):\n - ${erros.join('\n - ')}`);
  process.exit(1);
}
console.log(`✓ SEO ok: ${publicos.length} páginas públicas verificadas, sitemap, robots e cascas noindex conferidos.`);
