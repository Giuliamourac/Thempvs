/**
 * Catálogo ESTÁTICO da Thempvs: peças cadastradas direto no frontend, com as fotos do projeto.
 * Não vem do banco nem da API, então aparece mesmo com o servidor desligado.
 *
 * Para cadastrar outra peça: importe a foto, copie um bloco de BRUTOS e preencha.
 *  - id            → único e sem espaços (também vira o endereço: /produtos/<id>)
 *  - cor           → "Branco", "Preto" ou "Cinza" (é o que o filtro de cor usa)
 *  - categoria     → slug de categoria (os filtros "Peça" usam o mesmo slug do resto do site)
 *  - imagemPrincipal / imagensSecundarias → fotos importadas abaixo
 *
 * Os preços são os do catálogo enviado pela Thempvs. Tamanhos e estoque NÃO foram informados,
 * por isso ficam vazios. Todas as peças pertencem à coleção Movement (moda fitness).
 */

// ---- Fotos: pasta src/assets/images/products/<cor>/ ----
import anaBranco from '../assets/images/products/white/ana-branco.jpg';
import floraBranco from '../assets/images/products/white/flora-branco.jpg';
import melissaBranco from '../assets/images/products/white/melissa-branco.jpg';
import irisBranco from '../assets/images/products/white/iris-branco.jpg';

import juliaPreto from '../assets/images/products/black/julia-preto.jpg';
import anaPreto from '../assets/images/products/black/ana-preto.jpg';
import floraPreto from '../assets/images/products/black/flora-preto.jpg';
import melissaPreto from '../assets/images/products/black/melissa-preto.jpg';
import jadePreto from '../assets/images/products/black/jade-preto.jpg';
import beatrizPreto1 from '../assets/images/products/black/beatriz-preto-1.jpg';
import beatrizPreto2 from '../assets/images/products/black/beatriz-preto-2.jpg';
import luaPreto1 from '../assets/images/products/black/lua-preto-1.jpg';
import luaPreto2 from '../assets/images/products/black/lua-preto-2.jpg';

import anaCinza from '../assets/images/products/gray/ana-cinza.jpg';
import juliaCinza from '../assets/images/products/gray/julia-cinza.jpg';
import irisCinza from '../assets/images/products/gray/iris-cinza.jpg';

export const CATEGORIA_ESTATICA = { slug: 'conjuntos', nome: 'Conjuntos' };
export const COLECAO_ESTATICA = { slug: 'movement', nome: 'Movement' };

const DESCRICOES = {
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

const BRUTOS = [
  // ---------- Brancos ----------
  { id: 'conjunto-ana-branco', nome: 'Conjunto Ana', descricao: DESCRICOES.ana, cor: 'Branco', preco: 159.9, imagemPrincipal: anaBranco },
  { id: 'conjunto-flora-branco', nome: 'Conjunto Flora', descricao: DESCRICOES.flora, cor: 'Branco', preco: 169.9, imagemPrincipal: floraBranco },
  { id: 'conjunto-melissa-branco', nome: 'Conjunto Melissa', descricao: DESCRICOES.melissa, cor: 'Branco', preco: 159.9, imagemPrincipal: melissaBranco },
  { id: 'macacao-iris-branco', nome: 'Macacão Íris', descricao: DESCRICOES.iris, cor: 'Branco', preco: 189.9, imagemPrincipal: irisBranco },

  // ---------- Pretos ----------
  { id: 'conjunto-ana-preto', nome: 'Conjunto Ana', descricao: DESCRICOES.ana, cor: 'Preto', preco: 159.9, imagemPrincipal: anaPreto },
  { id: 'conjunto-flora-preto', nome: 'Conjunto Flora', descricao: DESCRICOES.flora, cor: 'Preto', preco: 169.9, imagemPrincipal: floraPreto },
  { id: 'conjunto-melissa-preto', nome: 'Conjunto Melissa', descricao: DESCRICOES.melissa, cor: 'Preto', preco: 159.9, imagemPrincipal: melissaPreto },
  { id: 'conjunto-jade-preto', nome: 'Conjunto Jade', descricao: DESCRICOES.jade, cor: 'Preto', preco: 169.9, imagemPrincipal: jadePreto },
  {
    id: 'conjunto-beatriz-preto',
    nome: 'Conjunto Beatriz',
    descricao: DESCRICOES.beatriz,
    cor: 'Preto',
    preco: 179.9,
    imagemPrincipal: beatrizPreto1, // frente
    imagensSecundarias: [beatrizPreto2], // costas
  },
  { id: 'conjunto-julia-preto', nome: 'Conjunto Júlia', descricao: DESCRICOES.julia, cor: 'Preto', preco: 149.9, imagemPrincipal: juliaPreto },
  {
    id: 'macaquinho-lua-preto',
    nome: 'Macaquinho Lua',
    descricao: DESCRICOES.lua,
    cor: 'Preto',
    preco: 149.9,
    imagemPrincipal: luaPreto1, // frente
    imagensSecundarias: [luaPreto2], // costas
  },

  // ---------- Cinzas ----------
  { id: 'conjunto-ana-cinza', nome: 'Conjunto Ana', descricao: DESCRICOES.ana, cor: 'Cinza', preco: 159.9, imagemPrincipal: anaCinza },
  { id: 'conjunto-julia-cinza', nome: 'Conjunto Júlia', descricao: DESCRICOES.julia, cor: 'Cinza', preco: 149.9, imagemPrincipal: juliaCinza },
  { id: 'macacao-iris-cinza', nome: 'Macacão Íris', descricao: DESCRICOES.iris, cor: 'Cinza', preco: 189.9, imagemPrincipal: irisCinza },
];

/**
 * Converte cada peça para o MESMO formato dos produtos da API (slug, imagens, cores, preco...),
 * assim cartões, carrosséis e filtros funcionam sem caminhos especiais.
 * `estatico: true` marca a origem; tamanhos e estoque ficam vazios de propósito (não foram informados).
 */
const paraProduto = ({ id, nome, descricao, cor, preco, categoria = CATEGORIA_ESTATICA.slug, imagemPrincipal, imagensSecundarias = [] }) => {
  const imagens = [imagemPrincipal, ...imagensSecundarias];
  return {
    estatico: true,
    id,
    slug: id,
    nome,
    descricao,
    categoria,
    cor,
    cores: [cor],
    imagem_url: imagemPrincipal,
    imagens,
    tamanhos: [],
    variacoes: [],
    medidas: [],
    colecao: COLECAO_ESTATICA,
    estoque: null,
    preco,
    preco_promocional: null,
    preco_final: preco,
  };
};

export const PRODUTOS_ESTATICOS = BRUTOS.map(paraProduto);
