/**
 * Configuração central de SEO da THEMPVS.
 * Arquivo "puro" (sem imports de imagens/Vite): é usado tanto pelo React (src/seo/Seo.jsx)
 * quanto pelo script de build (scripts/postbuild-seo.mjs), então título, descrição e URLs
 * ficam iguais no HTML gerado no build e no que o React coloca na página depois.
 *
 * Para trocar de domínio no futuro (ex.: thempvs.com.br), mude SÓ o SITE_URL abaixo
 * (ou defina VITE_SITE_URL na Vercel) e publique de novo.
 */

const doAmbiente =
  typeof process !== 'undefined' && process.env?.VITE_SITE_URL ? String(process.env.VITE_SITE_URL) : '';

/** Domínio oficial (sem barra no final). */
export const SITE_URL = (doAmbiente || 'https://thempvs-frontend.vercel.app').replace(/\/+$/, '');

/**
 * Código de verificação do Google Search Console (método "Tag HTML"). Cole SÓ o valor de content="..."
 * (ex.: 'AbC123...') ou defina VITE_GOOGLE_SITE_VERIFICATION na Vercel. O build coloca a tag em todas as páginas.
 */
export const GOOGLE_SITE_VERIFICATION =
  (typeof process !== 'undefined' && process.env?.VITE_GOOGLE_SITE_VERIFICATION) || 'ReBq95sgtFy48ZRHP-8WMxQ6npFZ1CwNn9YkleNhUpU';

export const SITE_NAME = 'THEMPVS';
export const DEFAULT_TITLE = 'THEMPVS | Moda e Estilo';
export const DEFAULT_DESCRIPTION =
  'Conheça a THEMPVS, uma loja de moda feminina com peças para diferentes estilos e ocasiões.';
export const DEFAULT_IMAGE = '/og-image.jpg';
export const DEFAULT_IMAGE_ALT = 'THEMPVS – moda e estilo: conjuntos e peças femininas';
export const LOCALE = 'pt_BR';

/** "Thempus" aparece porque o Instagram da marca usa essa grafia (@thempus.wear): quem digita assim também encontra. */
export const KEYWORDS = [
  'THEMPVS',
  'Thempus',
  'Thempus Wear',
  'moda feminina',
  'loja de roupas femininas',
  'roupas femininas',
  'moda fitness feminina',
  'conjuntos femininos',
  'roupas de academia',
  'moda e estilo',
  'comprar roupas online',
];

/** Monta a URL absoluta a partir de um caminho ("/produtos" → "https://.../produtos"). A home leva a barra final. */
export const absoluteUrl = (path = '/') => {
  const limpo = String(path || '/');
  if (/^https?:\/\//i.test(limpo)) return limpo;
  return `${SITE_URL}${limpo.startsWith('/') ? limpo : `/${limpo}`}`;
};

/** Páginas públicas fixas (as que entram no sitemap e viram HTML estático no build). */
export const PAGINAS_PUBLICAS = [
  {
    path: '/',
    arquivo: 'index.html',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    titulo: 'THEMPVS – Moda e Estilo',
  },
  {
    path: '/produtos',
    arquivo: 'produtos.html',
    title: 'Roupas Femininas e Conjuntos | THEMPVS',
    description:
      'Veja todos os produtos da THEMPVS: conjuntos, macacões e roupas femininas para treinar e para o dia a dia. Filtre por peça, cor e tamanho.',
    titulo: 'Produtos THEMPVS',
  },
  {
    path: '/sale',
    arquivo: 'sale.html',
    title: 'Sale | Promoções de Moda Feminina | THEMPVS',
    description:
      'Aproveite as promoções da THEMPVS: roupas femininas e peças de moda fitness com preço especial por tempo limitado.',
    titulo: 'Sale – promoções THEMPVS',
  },
  {
    path: '/movement',
    arquivo: 'movement.html',
    title: 'Movement | Moda Fitness Feminina | THEMPVS',
    description:
      'Movement é a linha de academia da THEMPVS: conjuntos, macacões e macaquinhos fitness femininos com estilo e conforto para treinar.',
    titulo: 'Movement – linha de academia THEMPVS',
  },
  {
    path: '/contato',
    arquivo: 'contato.html',
    title: 'Contato e Atendimento | THEMPVS',
    description:
      'Fale com a THEMPVS: SAC por telefone e e-mail, suporte para entregas, WhatsApp de pedidos e redes sociais da loja de moda feminina.',
    titulo: 'Contato THEMPVS',
  },
  {
    path: '/quem-usa',
    arquivo: 'quem-usa.html',
    title: 'Quem Usa THEMPVS | Modelos e Eventos',
    description:
      'Conheça quem usa THEMPVS: os modelos da marca, as campanhas e os eventos onde você pode encontrar nossas peças de moda e estilo.',
    titulo: 'Quem usa, usa THEMPVS',
  },
  {
    path: '/quem-usa/evento/codigo-de-rua',
    arquivo: 'quem-usa/evento/codigo-de-rua.html',
    title: 'Código de Rua – Encontro de Cultura Hip-Hop | THEMPVS',
    description:
      'Uma tarde inteira de breaking, grafite ao vivo, DJs e moda urbana para celebrar a essência do hip-hop. Evento com a participação da THEMPVS.',
    titulo: 'Código de Rua – Encontro de Cultura Hip-Hop',
  },
];

/** Nomes bonitos de categorias conhecidas (as demais caem no próprio slug, com a inicial maiúscula). */
export const NOMES_DE_CATEGORIAS = {
  camisetas: 'Camisetas',
  shorts: 'Shorts',
  bermudas: 'Bermudas',
  calcas: 'Calças',
  casacos: 'Casacos',
  conjuntos: 'Conjuntos',
  acessorios: 'Acessórios',
  'macacoes-e-macaquinhos': 'Macacões e Macaquinhos',
};

export const nomeDaCategoriaSeo = (slug) => {
  const limpo = String(slug ?? '').trim();
  if (NOMES_DE_CATEGORIAS[limpo]) return NOMES_DE_CATEGORIAS[limpo];
  const legivel = limpo.replace(/-/g, ' ');
  return legivel.charAt(0).toUpperCase() + legivel.slice(1);
};

/** Metadados de uma categoria (/produtos?categoria=slug): é uma página própria, com URL canônica própria. */
export const metaDaCategoria = (slug) => {
  const nome = nomeDaCategoriaSeo(slug);
  return {
    path: `/produtos?categoria=${encodeURIComponent(slug)}`,
    title: `${nome} | Moda Feminina | THEMPVS`,
    description: `Veja ${nome.toLowerCase()} da THEMPVS: moda feminina com peças para diferentes estilos e ocasiões. Escolha sua cor e tamanho e compre online.`,
    titulo: `${nome} – THEMPVS`,
  };
};

/**
 * Páginas PRIVADAS ou sem conteúdo: nunca devem ser indexadas (noindex) nem entrar no sitemap.
 * Mantenha em sincronia com as rotas em src/App.jsx e com vercel.json / public/robots.txt.
 */
export const ROTAS_PRIVADAS = [
  { teste: /^\/carrinho\/?$/, title: 'Carrinho | THEMPVS' },
  { teste: /^\/entrar\/?$/, title: 'Entrar | THEMPVS' },
  { teste: /^\/cadastrar\/?$/, title: 'Criar conta | THEMPVS' },
  { teste: /^\/perfil\/?$/, title: 'Minha conta | THEMPVS' },
  { teste: /^\/pedidos(\/[^/]+)?\/?$/, title: 'Meus pedidos | THEMPVS' },
  { teste: /^\/admin(\/.*)?$/, title: 'Administração | THEMPVS' },
  { teste: /^\/lojas\/?$/, title: 'Lojas | THEMPVS' },
];

const SEM_BARRA = (p) => (p.length > 1 ? p.replace(/\/+$/, '') : p);

/**
 * Metadados da rota atual (para o React). Devolve null quando a página cuida dos próprios metadados
 * (página de produto, que depende dos dados vindos da API).
 *
 * `busca` = string da query ("?categoria=conjuntos&cor=Preto").
 */
export function metaDaRota(pathname, busca = '') {
  const path = SEM_BARRA(pathname || '/');
  const params = new URLSearchParams(busca);

  // /produtos/<slug>: quem define é a própria página do produto.
  if (/^\/produtos\/[^/]+$/.test(path)) return null;

  const privada = ROTAS_PRIVADAS.find((r) => r.teste.test(path));
  if (privada) {
    return { title: privada.title, description: DEFAULT_DESCRIPTION, path, noindex: true };
  }

  const fixa = PAGINAS_PUBLICAS.find((p) => p.path === path);
  if (!fixa) {
    return {
      title: 'Página não encontrada | THEMPVS',
      description: DEFAULT_DESCRIPTION,
      path: null, // sem canonical: a página não existe
      noindex: true,
    };
  }

  // Listagem de produtos: filtros viram variações da mesma página.
  if (path === '/produtos') {
    const categorias = params.getAll('categoria');
    const temBusca = (params.get('q') ?? '').trim() !== '';
    const base = categorias.length === 1 ? metaDaCategoria(categorias[0]) : fixa;
    return {
      title: base.title,
      description: base.description,
      path: base.path, // /produtos  ou  /produtos?categoria=<slug>  (cor, tamanho, ordem... não mudam o canonical)
      noindex: temBusca, // resultado de busca interna não deve ser indexado
    };
  }

  return { title: fixa.title, description: fixa.description, path: fixa.path, noindex: false };
}
