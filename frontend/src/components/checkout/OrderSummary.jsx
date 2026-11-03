import { useState } from 'react';
import { Link } from 'react-router-dom';
import { limiteDoItem } from '../../hooks/useCartStore.js';
import { formatarCentavos, formatarMoeda } from '../../utils/format.js';

function Miniatura({ imagem }) {
  const [falhou, setFalhou] = useState(false);

  return (
    <div className="resumo-miniatura">
      {imagem && !falhou ? (
        <img src={imagem} alt="" onError={() => setFalhou(true)} />
      ) : (
        <span className="resumo-miniatura-vazia">Sem imagem</span>
      )}
    </div>
  );
}

function ItemDoResumo({ item, cart, linha }) {
  const precoUnitario = linha?.preco_unitario != null ? Math.round(linha.preco_unitario * 100) : item.precoCentavos;

  return (
    <li className="resumo-item">
      <Miniatura imagem={item.imagem} />

      <div className="resumo-item-dados">
        <div className="resumo-item-topo">
          <p className="resumo-item-nome">{item.nome}</p>
          <p className="resumo-item-preco">{formatarCentavos(precoUnitario * item.quantidade)}</p>
        </div>

        <div className="resumo-item-corpo">
          <div className="resumo-item-detalhes">
            {item.cor && (
              <p>
                Cor: <span>{item.cor}</span>
              </p>
            )}
            {item.tamanho && (
              <p>
                Tamanho: <span>{item.tamanho}</span>
              </p>
            )}
            {item.quantidade > 1 && (
              <p className="resumo-item-unit">{formatarCentavos(precoUnitario)} cada</p>
            )}
          </div>

          <div className="resumo-item-acoes">
            <div className="quantidade">
              <button
                type="button"
                className="quantidade-botao"
                aria-label={`Aumentar quantidade de ${item.nome}`}
                disabled={item.quantidade >= limiteDoItem(item)}
                onClick={() => cart.alterarQuantidade(item.variacaoId, 1)}
              >
                +
              </button>
              <span className="quantidade-valor" aria-live="polite">
                {item.quantidade}
              </span>
              <button
                type="button"
                className="quantidade-botao"
                aria-label={`Diminuir quantidade de ${item.nome}`}
                disabled={item.quantidade <= 1}
                onClick={() => cart.alterarQuantidade(item.variacaoId, -1)}
              >
                −
              </button>
            </div>

            <button
              type="button"
              className="resumo-remover"
              aria-label={`Remover ${item.nome} do carrinho`}
              onClick={() => cart.remover(item.variacaoId)}
            >
              Remover
            </button>
          </div>
        </div>

        {linha && !linha.disponivel && (
          <p className="resumo-item-problema" role="alert">
            {linha.problema}
          </p>
        )}
      </div>
    </li>
  );
}

export default function OrderSummary({ cart, quote, carregando, erro, freteEscolhido, onTentarDeNovo }) {
  const { itens } = cart;
  const linhaDe = (item) => quote?.itens.find((linha) => linha.variacao_id === item.variacaoId);

  // Subtotal do servidor quando já chegou; senão a estimativa do carrinho.
  const subtotal = quote ? quote.subtotal : cart.totais.subtotalCentavos / 100;
  const frete = freteEscolhido?.valor ?? null;
  const total = subtotal + (frete ?? 0);

  let textoFrete = 'A calcular';
  if (itens.length === 0) textoFrete = '—';
  else if (frete !== null) textoFrete = frete === 0 ? 'Grátis' : formatarMoeda(frete);

  return (
    <aside className="resumo" aria-labelledby="tituloResumo">
      <h2 className="resumo-titulo" id="tituloResumo">
        Resumo do Pedido
      </h2>

      <ul className="resumo-itens">
        {itens.map((item) => (
          <ItemDoResumo key={item.variacaoId} item={item} cart={cart} linha={linhaDe(item)} />
        ))}
      </ul>

      {itens.length === 0 && (
        <div className="resumo-vazio">
          <p>Seu carrinho está vazio.</p>
          <Link to="/produtos" className="resumo-link-produtos">
            Ver produtos
          </Link>
        </div>
      )}

      {quote && !quote.pode_finalizar && (
        <div className="resumo-aviso resumo-aviso-erro" role="alert">
          <p>Alguns itens mudaram de estoque ou saíram de venda.</p>
          <button type="button" className="resumo-ajustar" onClick={() => cart.ajustarAoServidor(quote.itens)}>
            Ajustar carrinho
          </button>
        </div>
      )}

      {erro && (
        <div className="resumo-aviso resumo-aviso-erro" role="alert">
          <p>{erro}</p>
          <button type="button" className="resumo-ajustar" onClick={onTentarDeNovo}>
            Tentar de novo
          </button>
        </div>
      )}

      <dl className="resumo-total">
        <div className="resumo-linha resumo-linha-total">
          <dt>Total</dt>
          <dd>{formatarMoeda(total)}</dd>
        </div>
      </dl>

      <dl className="resumo-extras">
        <div className="resumo-linha">
          <dt>Subtotal</dt>
          <dd>
            {formatarMoeda(subtotal)}
            {carregando && <span className="sr-only"> (atualizando)</span>}
          </dd>
        </div>
        <div className="resumo-linha">
          <dt>Frete</dt>
          <dd>{textoFrete}</dd>
        </div>
      </dl>
    </aside>
  );
}
