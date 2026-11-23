/**
 * Pós-build de SEO (roda automaticamente depois do `vite build`; veja "build" no package.json).
 *
 * O site é uma SPA (React): o Vite gera UM index.html vazio. Este script pega esse HTML e gera, dentro de /dist:
 *   • um HTML por página pública (home, produtos, sale, movement, contato, quem-usa, evento e cada produto), já com
 *     <title>, descrição, canonical, Open Graph, Twitter Card, JSON-LD e um bloco <noscript> com texto e links;
 *   • app.html     → "casca" neutra para produtos novos (que ainda não existiam no deploy);
 *   • private.html → casca com noindex para login, cadastro, carrinho, perfil, pedidos e admin;
 *   • 404.html     → página de erro com noindex (a Vercel responde com status 404 de verdade);
 *   • sitemap.xml  → todas as páginas públicas + produtos + categorias;
 *   • robots.txt   → copiado de /public com o endereço do sitemap conferido.
 *
 * Os produtos vêm da API (VITE_API_URL). Se a API estiver dormindo/fora do ar na hora do deploy,
 * usa-se src/seo/fallbackProducts.js e o build continua (nunca quebra o deploy por causa de rede).
 *
 * Variáveis opcionais: SEO_SKIP_API=1 (não consulta a API), SEO_API_TIMEOUT_MS (padrão 70000), VITE_SITE_URL.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_IMAGE,
  DEFAULT_IMAGE_ALT,
  DEFAULT_TITLE,
  GOOGLE_SITE_VERIFICATION,
  KEYWORDS,
  LOCALE,
  PAGINAS_PUBLICAS,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  metaDaCategoria,
  nomeDaCategoriaSeo,
} from '../src/seo/siteConfig.js';
import { PRODUTOS_FALLBACK } from '../src/seo/fallbackProducts.js';
import { caminhoDoProduto, jsonLdDaPagina, jsonLdDoProduto, metaDoProduto } from '../src/seo/structuredData.js';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(RAIZ, 'dist');
const hoje = new Date().toISOString().slice(0, 10);

const esc = (texto) =>
  String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const escXml = (texto) => esc(texto).replace(/'/g, '&apos;');

/** JSON dentro de <script>: "<" vira < para o conteúdo nunca fechar a tag. */
const jsonSeguro = (dados) => JSON.stringify(dados).replace(/</g, '\\u003c');

// ---------------------------------------------------------------- produtos (API → fallback)

function urlDaApi() {
  if (process.env.VITE_API_URL) return process.env.VITE_API_URL;
  const arquivo = join(RAIZ, '.env');
  if (existsSync(arquivo)) {
    const linha = readFileSync(arquivo, 'utf8')
      .split(/\r?\n/)
      .find((l) => l.trim().startsWith('VITE_API_URL='));
    if (linha) return linha.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  }
  return null;
}

async function buscarProdutosDaApi() {
  const api = urlDaApi();
  if (process.env.SEO_SKIP_API === '1' || !api) return null;
  const limite = Number(process.env.SEO_API_TIMEOUT_MS) || 70000;

  try {
    const todos = [];
    let pagina = 1;
    let paginas = 1;
    do {
      const resposta = await fetch(`${api.replace(/\/+$/, '')}/products?limite=100&pagina=${pagina}`, {
        signal: AbortSignal.timeout(limite),
        headers: { Accept: 'application/json' },
      });
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
      const corpo = await resposta.json();
      if (!Array.isArray(corpo.itens)) throw new Error('resposta inesperada');
      todos.push(...corpo.itens);
      paginas = Number(corpo.paginas) || 1;
      pagina += 1;
    } while (pagina <= paginas);
    return todos.filter((p) => p?.slug && p?.nome);
  } catch (erro) {
    console.warn(`[seo] API indisponível (${erro.message}); usando a lista de reserva de produtos.`);
    return null;
  }
}

// ---------------------------------------------------------------- HTML

function blocoMeta({ title, description, path, noindex = false, image = DEFAULT_IMAGE, imageAlt = DEFAULT_IMAGE_ALT, type = 'website', jsonLd = [] }) {
  const url = path ? absoluteUrl(path) : null;
  const imagem = absoluteUrl(image);
  const linhas = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<meta name="keywords" content="${esc(KEYWORDS.join(', '))}" />`,
    `<meta name="robots" content="${noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}" />`,
  ];
  if (url && !noindex) linhas.push(`<link rel="canonical" href="${esc(url)}" />`);
  linhas.push(
    `<meta property="og:type" content="${esc(type)}" />`,
    `<meta property="og:site_name" content="${esc(SITE_NAME)}" />`,
    `<meta property="og:locale" content="${LOCALE}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
  );
  if (url) linhas.push(`<meta property="og:url" content="${esc(url)}" />`);
  linhas.push(
    `<meta property="og:image" content="${esc(imagem)}" />`,
    `<meta property="og:image:alt" content="${esc(imageAlt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(imagem)}" />`,
  );
  for (const item of jsonLd) {
    // data-seo-jsonld: o <Seo> do React troca estes blocos quando a rota muda no navegador.
    linhas.push(`<script type="application/ld+json" data-seo-jsonld>${jsonSeguro(item)}</script>`);
  }
  return linhas.map((l) => `    ${l}`).join('\n');
}

const MENU = [
  ['/', 'Início'],
  ['/produtos', 'Produtos'],
  ['/sale', 'Sale'],
  ['/movement', 'Movement'],
  ['/contato', 'Contato'],
  ['/quem-usa', 'Quem Usa'],
];

/** Conteúdo para quem não executa JavaScript (rastreadores simples, pré-visualizações). Não aparece no navegador normal. */
function blocoNoscript({ titulo, descricao, extra = '' }) {
  const links = MENU.map(([path, nome]) => `<li><a href="${esc(absoluteUrl(path))}">${esc(nome)}</a></li>`).join('');
  return `<noscript>
      <header><nav aria-label="Principal"><ul>${links}</ul></nav></header>
      <main>
        <h1>${esc(titulo)}</h1>
        <p>${esc(descricao)}</p>
        ${extra}
        <p>Para navegar e comprar na loja, ative o JavaScript no seu navegador.</p>
      </main>
    </noscript>`;
}

function montarHtml(modelo, meta, noscript) {
  const verificacao = GOOGLE_SITE_VERIFICATION
    ? `\n    <meta name="google-site-verification" content="${esc(GOOGLE_SITE_VERIFICATION)}" />`
    : '';
  let html = modelo.replace(/<!--seo:start-->[\s\S]*?<!--seo:end-->/, `<!--seo:start-->${verificacao}\n${blocoMeta(meta)}\n    <!--seo:end-->`);
  // Os marcadores ficam no arquivo gerado, então o script pode ser executado de novo sem erro.
  html = html.replace(
    /<!--seo:noscript-->(?:[\s\S]*?<!--\/seo:noscript-->)?/,
    () => `<!--seo:noscript-->${noscript ? `\n    ${noscript}\n    ` : ''}<!--/seo:noscript-->`,
  );
  return html;
}

function gravar(arquivo, conteudo) {
  const destino = join(DIST, arquivo);
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, conteudo);
}

const formatarPreco = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// ---------------------------------------------------------------- principal

async function main() {
  const arquivoModelo = join(DIST, 'index.html');
  if (!existsSync(arquivoModelo)) throw new Error('dist/index.html não existe: rode `vite build` antes deste script.');
  const modelo = readFileSync(arquivoModelo, 'utf8');
  if (!modelo.includes('<!--seo:start-->') || !modelo.includes('<!--seo:noscript-->')) {
    throw new Error('Marcadores <!--seo:start--> / <!--seo:noscript--> não encontrados em dist/index.html.');
  }

  const daApi = await buscarProdutosDaApi();
  const produtos = daApi ?? PRODUTOS_FALLBACK;
  console.log(`[seo] ${produtos.length} produto(s) (${daApi ? 'da API' : 'lista de reserva'}).`);

  const listaProdutos = (itens) =>
    itens.length === 0
      ? ''
      : `<h2>Produtos</h2><ul>${itens
          .map((p) => `<li><a href="${esc(absoluteUrl(caminhoDoProduto(p)))}">${esc(p.nome)}</a></li>`)
          .join('')}</ul>`;

  // 1) Páginas públicas fixas
  for (const pagina of PAGINAS_PUBLICAS) {
    const extra = ['/', '/produtos', '/movement'].includes(pagina.path) ? listaProdutos(produtos) : '';
    gravar(
      pagina.arquivo,
      montarHtml(
        modelo,
        { title: pagina.title, description: pagina.description, path: pagina.path, jsonLd: jsonLdDaPagina(pagina.path) },
        blocoNoscript({ titulo: pagina.titulo, descricao: pagina.description, extra }),
      ),
    );
  }

  // 2) Uma página por produto
  for (const produto of produtos) {
    const meta = metaDoProduto(produto);
    const imagem = (produto.imagens ?? []).find((src) => src && !String(src).startsWith('data:')) ?? produto.imagem_url;
    const preco = Number(produto.preco_final ?? produto.preco);
    const extra = `<p>${esc(produto.descricao ?? '')}</p>${Number.isFinite(preco) ? `<p>Preço: ${esc(formatarPreco(preco))}</p>` : ''}${
      produto.cores?.length ? `<p>Cores: ${esc(produto.cores.join(', '))}</p>` : ''
    }<p><a href="${esc(absoluteUrl('/produtos'))}">Ver todos os produtos</a></p>`;
    gravar(
      `produtos/${produto.slug}.html`,
      montarHtml(
        modelo,
        {
          ...meta,
          image: imagem && !String(imagem).startsWith('data:') ? imagem : DEFAULT_IMAGE,
          imageAlt: produto.nome,
          type: 'product',
          jsonLd: jsonLdDoProduto(produto, nomeDaCategoriaSeo(produto.categoria)),
        },
        blocoNoscript({ titulo: produto.nome, descricao: meta.description, extra }),
      ),
    );
  }

  // 3) Cascas especiais
  gravar(
    'app.html', // produtos cadastrados depois do deploy: o React troca os metadados ao carregar o produto
    montarHtml(modelo, { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, path: null }, blocoNoscript({ titulo: DEFAULT_TITLE, descricao: DEFAULT_DESCRIPTION })),
  );
  gravar(
    'private.html',
    montarHtml(modelo, { title: `Área restrita | ${SITE_NAME}`, description: DEFAULT_DESCRIPTION, path: null, noindex: true }, ''),
  );
  gravar(
    '404.html',
    montarHtml(modelo, { title: `Página não encontrada | ${SITE_NAME}`, description: DEFAULT_DESCRIPTION, path: null, noindex: true }, ''),
  );

  // 4) Sitemap
  const categorias = [...new Set(produtos.map((p) => p.categoria).filter(Boolean))].sort();
  const entradas = [
    ...PAGINAS_PUBLICAS.map((p) => ({ loc: absoluteUrl(p.path), lastmod: hoje })),
    ...categorias.map((slug) => ({ loc: absoluteUrl(metaDaCategoria(slug).path), lastmod: hoje })),
    ...produtos.map((p) => ({
      loc: absoluteUrl(caminhoDoProduto(p)),
      lastmod: String(p.atualizado_em ?? p.updated_at ?? '').slice(0, 10).match(/^\d{4}-\d{2}-\d{2}$/)?.[0] ?? hoje,
      imagens: [...new Set([...(p.imagens ?? []), p.imagem_url].filter((src) => src && !String(src).startsWith('data:')))].map((src) => absoluteUrl(src)),
      titulo: p.nome,
    })),
  ];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ...entradas.map((e) =>
      [
        '  <url>',
        `    <loc>${escXml(e.loc)}</loc>`,
        `    <lastmod>${e.lastmod}</lastmod>`,
        ...(e.imagens ?? []).map((src) => `    <image:image><image:loc>${escXml(src)}</image:loc>${e.titulo ? `<image:title>${escXml(e.titulo)}</image:title>` : ''}</image:image>`),
        '  </url>',
      ].join('\n'),
    ),
    '</urlset>',
    '',
  ].join('\n');
  gravar('sitemap.xml', xml);

  // 5) robots.txt com o domínio configurado
  const robots = readFileSync(join(RAIZ, 'public', 'robots.txt'), 'utf8').replace(
    /^Sitemap:.*$/m,
    `Sitemap: ${SITE_URL}/sitemap.xml`,
  );
  gravar('robots.txt', robots);

  console.log(`[seo] ${entradas.length} URLs no sitemap; HTMLs estáticos gerados em dist/.`);
}

main().catch((erro) => {
  console.error('[seo] Falha ao gerar os arquivos de SEO:', erro);
  process.exit(1);
});
