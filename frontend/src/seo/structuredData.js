/**
 * Dados estruturados (Schema.org / JSON-LD). Funções puras, usadas pelo React e pelo script de build.
 */
import { CONTATOS, INSTAGRAM_URL, telefoneInternacional } from '../constants/contact.js';
import { DEFAULT_DESCRIPTION, DEFAULT_IMAGE, SITE_NAME, SITE_URL, absoluteUrl } from './siteConfig.js';

const ID_ORGANIZACAO = `${SITE_URL}/#organization`;
const ID_SITE = `${SITE_URL}/#website`;

/** A loja (loja virtual, sem endereço físico: por isso OnlineStore e não LocalBusiness). */
export const organizacaoLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'OnlineStore',
  '@id': ID_ORGANIZACAO,
  name: SITE_NAME,
  alternateName: ['Thempvs', 'Thempus Wear'],
  description: DEFAULT_DESCRIPTION,
  url: `${SITE_URL}/`,
  logo: absoluteUrl('/logo.png'),
  image: absoluteUrl(DEFAULT_IMAGE),
  slogan: 'Moda e Estilo',
  sameAs: [INSTAGRAM_URL.split('?')[0]],
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: telefoneInternacional(CONTATOS.sac.telefone),
      email: CONTATOS.sac.email,
      areaServed: 'BR',
      availableLanguage: 'pt-BR',
    },
  ],
});

/** O site em si, com a caixa de busca da loja (a busca interna usa /produtos?q=). */
export const siteLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': ID_SITE,
  url: `${SITE_URL}/`,
  name: SITE_NAME,
  description: DEFAULT_DESCRIPTION,
  inLanguage: 'pt-BR',
  publisher: { '@id': ID_ORGANIZACAO },
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/produtos?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
});

export const paginaContatoLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'Contato THEMPVS',
  url: absoluteUrl('/contato'),
  inLanguage: 'pt-BR',
  isPartOf: { '@id': ID_SITE },
  about: { '@id': ID_ORGANIZACAO },
});

export const breadcrumbLd = (itens) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: itens.map(([nome, path], i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: nome,
    item: absoluteUrl(path),
  })),
});

/** Texto curto para meta description: sem quebras de linha, termina em palavra inteira, até ~155 caracteres. */
export const resumir = (texto, limite = 155) => {
  const limpo = String(texto ?? '').replace(/\s+/g, ' ').trim();
  if (limpo.length <= limite) return limpo;
  const corte = limpo.slice(0, limite - 1);
  return `${corte.slice(0, corte.lastIndexOf(' ') > 80 ? corte.lastIndexOf(' ') : corte.length).replace(/[,;:.\s]+$/, '')}…`;
};

/** Caminho da página do produto. */
export const caminhoDoProduto = (produto) => `/produtos/${produto.slug}`;

/** Primeira frase da descrição (até ~120 caracteres); se for longa demais, resume em palavra inteira. */
const primeiraFrase = (texto) => {
  const limpo = String(texto ?? '').replace(/\s+/g, ' ').trim();
  const fim = limpo.search(/[.!?](\s|$)/);
  const frase = fim > 0 ? limpo.slice(0, fim + 1) : limpo;
  return frase.length <= 120 ? frase : resumir(frase, 118);
};

const listaComE = (itens) =>
  itens.length <= 1 ? itens.join('') : `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`;

/** Metadados da página de um produto (formato da API: nome, descricao, preco, imagens, cores, categoria...). */
export function metaDoProduto(produto) {
  const cores = Array.isArray(produto.cores) ? produto.cores.filter(Boolean).map((c) => String(c).toLowerCase()) : [];
  const frase = primeiraFrase(produto.descricao) || 'Moda feminina com estilo.';
  const disponivel = cores.length > 0 ? ` Disponível em ${listaComE(cores)}.` : '';
  // Acrescenta cada complemento só se couber em 160 caracteres (nada de frase cortada no meio).
  let description = resumir(`${produto.nome}: ${frase}`, 160);
  for (const extra of [disponivel, ' Compre online na THEMPVS.']) {
    if (extra && `${description}${extra}`.length <= 160) description += extra;
  }
  return {
    title: `${produto.nome} | THEMPVS`,
    description,
    path: caminhoDoProduto(produto),
  };
}

/** Product + Offer. `estoque` nulo/ausente = desconhecido (não informa disponibilidade). */
export function produtoLd(produto) {
  const imagens = [...new Set([...(produto.imagens ?? []), produto.imagem_url].filter(Boolean))]
    .filter((src) => !String(src).startsWith('data:'))
    .map((src) => absoluteUrl(src));

  const preco = Number(produto.preco_final ?? produto.preco_promocional ?? produto.preco);
  const oferta = {
    '@type': 'Offer',
    url: absoluteUrl(caminhoDoProduto(produto)),
    priceCurrency: 'BRL',
    price: Number.isFinite(preco) ? preco.toFixed(2) : undefined,
    itemCondition: 'https://schema.org/NewCondition',
    seller: { '@id': ID_ORGANIZACAO },
  };
  if (typeof produto.estoque === 'number') {
    oferta.availability = produto.estoque > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${absoluteUrl(caminhoDoProduto(produto))}#product`,
    name: produto.nome,
    description: String(produto.descricao ?? '').replace(/\s+/g, ' ').trim() || undefined,
    sku: produto.slug,
    image: imagens.length > 0 ? imagens : undefined,
    brand: { '@type': 'Brand', name: SITE_NAME },
    color: Array.isArray(produto.cores) && produto.cores.length > 0 ? produto.cores.join(', ') : undefined,
    url: absoluteUrl(caminhoDoProduto(produto)),
    offers: oferta,
  };
}

/** JSON-LD completo de um produto (Product + trilha de navegação). */
export const jsonLdDoProduto = (produto, nomeCategoria) => [
  produtoLd(produto),
  breadcrumbLd([
    ['Início', '/'],
    ['Produtos', '/produtos'],
    ...(nomeCategoria && produto.categoria ? [[nomeCategoria, `/produtos?categoria=${encodeURIComponent(produto.categoria)}`]] : []),
    [produto.nome, caminhoDoProduto(produto)],
  ]),
];

/** JSON-LD das páginas fixas. */
export function jsonLdDaPagina(path) {
  if (path === '/') return [organizacaoLd(), siteLd()];
  if (path === '/contato') return [paginaContatoLd(), organizacaoLd()];
  if (path === '/produtos') return [breadcrumbLd([['Início', '/'], ['Produtos', '/produtos']])];
  return [];
}
