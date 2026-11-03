import { useState } from 'react';
import { Link } from 'react-router-dom';
import Preco from './Preco.jsx';
import ProductImage from './ProductImage.jsx';

/** Cartão da listagem /produtos. A seleção de tamanho é independente em cada cartão. */
export default function CatalogCard({ produto }) {
  const [selecionado, setSelecionado] = useState('');

  return (
    <div className="cartao-produto">
      <Link to={`/produtos/${produto.slug}`} className="link-produto">
        <div className="imagem-produto">
          <ProductImage src={produto.imagem_url} alt={produto.nome} />
        </div>
        <div className="info-produto">
          <h4 className="titulo-produto">{produto.nome}</h4>
          <Preco produto={produto} className="preco-produto" />
          {produto.estoque === 0 && <span className="tag-esgotado">Esgotado</span>}
        </div>
      </Link>

      <div className="tamanhos-produto">
        {produto.tamanhos.map((tamanho) => {
          const ativo = selecionado === tamanho;
          return (
            <button
              key={tamanho}
              type="button"
              className={`tamanho-produto${ativo ? ' selecionado' : ''}`}
              aria-pressed={ativo}
              aria-label={`Selecionar tamanho ${tamanho}`}
              onClick={() => setSelecionado(ativo ? '' : tamanho)}
            >
              {tamanho}
            </button>
          );
        })}
      </div>
    </div>
  );
}
