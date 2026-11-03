/** Tamanhos e cores sugeridos (o admin também pode digitar valores próprios). */
export const TAMANHOS_PADRAO = [
  'P',
  'M',
  'G',
  'GG',
  'P Infantil',
  'M Infantil',
  'G Infantil',
  'GG Infantil',
  'Único',
];

export const CORES_PADRAO = ['Preto', 'Branco', 'Azul', 'Verde', 'Off White', 'Cinza'];

/** Frete grátis a partir de R$ 199,90 (mesmo valor do aviso do topo do site). */
export const FRETE_GRATIS_MINIMO_CENTAVOS = 19990;

const SVG_SEM_IMAGEM =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800"><rect width="600" height="800" fill="#e0e0e0"/><text x="300" y="410" font-family="Arial, sans-serif" font-size="32" fill="#777" text-anchor="middle">Sem imagem</text></svg>';

/** Imagem embutida usada quando o produto não tem foto (ou a URL falha). */
export const IMAGEM_PADRAO = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SVG_SEM_IMAGEM)}`;
