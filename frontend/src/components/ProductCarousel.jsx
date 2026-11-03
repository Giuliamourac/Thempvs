import { useState } from 'react';
import ProductCard from './ProductCard.jsx';

/** Vitrine com setas: mostra `visiveis` produtos por vez e avança de página em página. */
export default function ProductCarousel({ titulo, produtos, visiveis = 4 }) {
  const [inicio, setInicio] = useState(0);

  const ultimoInicio = Math.max(0, produtos.length - visiveis);
  const atual = Math.min(inicio, ultimoInicio);
  const exibidos = produtos.slice(atual, atual + visiveis);

  return (
    <section className="vitrine">
      <h2>{titulo}</h2>

      <div className="carrossel">
        <button
          type="button"
          className="seta"
          aria-label="Anterior"
          disabled={atual === 0}
          onClick={() => setInicio(Math.max(0, atual - visiveis))}
        >
          &#8249;
        </button>

        <ul className="listaProdutos">
          {exibidos.map((produto) => (
            <li key={produto.id}>
              <ProductCard produto={produto} />
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="seta"
          aria-label="Próximo"
          disabled={atual >= ultimoInicio}
          onClick={() => setInicio(Math.min(ultimoInicio, atual + visiveis))}
        >
          &#8250;
        </button>
      </div>
    </section>
  );
}
