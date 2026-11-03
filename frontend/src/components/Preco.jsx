import { formatarMoeda } from '../utils/format.js';

/** Preço do produto: em promoção mostra o preço antigo riscado + o preço final. */
export default function Preco({ produto, className = '' }) {
  const emPromocao = produto.preco_promocional !== null && produto.preco_promocional < produto.preco;

  if (!emPromocao) return <span className={className}>{formatarMoeda(produto.preco)}</span>;

  return (
    <span className={`preco-promo ${className}`.trim()}>
      <s className="preco-antigo">
        <span className="sr-only">De </span>
        {formatarMoeda(produto.preco)}
      </s>{' '}
      <strong className="preco-novo">
        <span className="sr-only">por </span>
        {formatarMoeda(produto.preco_final)}
      </strong>
    </span>
  );
}
