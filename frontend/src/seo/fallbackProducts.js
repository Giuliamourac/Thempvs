/**
 * Peças da coleção Movement (as mesmas do seed do backend: scripts/seed-movement.js).
 * Só é usado no BUILD (scripts/postbuild-seo.mjs) quando a API não responde na hora do deploy —
 * por exemplo, o Render grátis "dormindo" — para o sitemap e as páginas pré-geradas nunca ficarem vazios.
 * Quando a API responde, os dados reais dela têm prioridade.
 */
const IMG = (cor, arquivo) => `/images/products/${cor}/${arquivo}`;

const D = {
  ana: 'Conjunto fitness de visual moderno, composto por cropped de mangas curtas e legging de cintura alta. Uma combinação versátil para treinos e para compor looks esportivos no dia a dia.',
  flora:
    'Conjunto fitness com top de alças finas e detalhe trançado na parte frontal, acompanhado de legging ajustada. Uma proposta delicada e moderna que valoriza os detalhes da peça.',
  beatriz:
    'Conjunto fitness com blusa de alças duplas e detalhes contrastantes em preto e branco. Possui visual diferenciado e moderno, ideal para quem procura um look esportivo com personalidade.',
  julia:
    'Conjunto fitness com modelagem moderna e detalhes diferenciados no cós, proporcionando um visual esportivo e versátil para diferentes ocasiões.',
  jade: 'Conjunto fitness composto por top e calça legging comprida, com proposta minimalista e elegante. Ideal para quem prefere peças básicas e versáteis.',
  melissa:
    'Conjunto fitness composto por regata cropped e legging comprida de cintura alta. Uma combinação prática e atemporal para acompanhar a rotina de treinos.',
  iris: 'Macacão fitness de modelagem ajustada, com recorte estratégico na região abdominal. Uma peça moderna que combina estilo esportivo e praticidade em uma única composição.',
  lua: 'Macaquinho fitness de comprimento curto, com costas abertas e detalhes de alças trançadas. Uma peça diferenciada que combina praticidade e estilo para os treinos.',
};

export const PRODUTOS_FALLBACK = [
  { slug: 'conjunto-ana', nome: 'Conjunto Ana', preco: 159.9, categoria: 'conjuntos', descricao: D.ana, cores: ['Branco', 'Preto', 'Cinza'], imagens: [IMG('black', 'ana-preto.jpg'), IMG('white', 'ana-branco.jpg'), IMG('gray', 'ana-cinza.jpg')] },
  { slug: 'conjunto-flora', nome: 'Conjunto Flora', preco: 169.9, categoria: 'conjuntos', descricao: D.flora, cores: ['Branco', 'Preto'], imagens: [IMG('white', 'flora-branco.jpg'), IMG('black', 'flora-preto.jpg')] },
  { slug: 'conjunto-beatriz', nome: 'Conjunto Beatriz', preco: 179.9, categoria: 'conjuntos', descricao: D.beatriz, cores: ['Preto'], imagens: [IMG('black', 'beatriz-preto-1.jpg'), IMG('black', 'beatriz-preto-2.jpg')] },
  { slug: 'conjunto-julia', nome: 'Conjunto Júlia', preco: 149.9, categoria: 'conjuntos', descricao: D.julia, cores: ['Cinza', 'Preto'], imagens: [IMG('gray', 'julia-cinza.jpg'), IMG('black', 'julia-preto.jpg')] },
  { slug: 'conjunto-jade', nome: 'Conjunto Jade', preco: 169.9, categoria: 'conjuntos', descricao: D.jade, cores: ['Preto'], imagens: [IMG('black', 'jade-preto.jpg')] },
  { slug: 'conjunto-melissa', nome: 'Conjunto Melissa', preco: 159.9, categoria: 'conjuntos', descricao: D.melissa, cores: ['Branco', 'Preto'], imagens: [IMG('white', 'melissa-branco.jpg'), IMG('black', 'melissa-preto.jpg')] },
  { slug: 'macacao-iris', nome: 'Macacão Íris', preco: 189.9, categoria: 'macacoes-e-macaquinhos', descricao: D.iris, cores: ['Branco', 'Cinza'], imagens: [IMG('white', 'iris-branco.jpg'), IMG('gray', 'iris-cinza.jpg')] },
  { slug: 'macaquinho-lua', nome: 'Macaquinho Lua', preco: 149.9, categoria: 'macacoes-e-macaquinhos', descricao: D.lua, cores: ['Preto'], imagens: [IMG('black', 'lua-preto-1.jpg'), IMG('black', 'lua-preto-2.jpg')] },
];
