import { useState } from 'react';
import { Link } from 'react-router-dom';
import Preco from './Preco.jsx';
import ProductImage from './ProductImage.jsx';
import OptionPicker from './OptionPicker.jsx';

export default function ProductCard({ produto }) {
  const [tamanho, setTamanho] = useState('');

  return (
    <article className="cardProduto">
      <Link to={`/produtos/${produto.slug}`}>
        <ProductImage src={produto.imagem_url} alt={produto.nome} />
        <h3>{produto.nome}</h3>
        <p>
          <Preco produto={produto} />
        </p>
      </Link>

      <OptionPicker
        options={produto.tamanhos}
        value={tamanho}
        onChange={setTamanho}
        label={`Tamanhos de ${produto.nome}`}
      />
    </article>
  );
}
