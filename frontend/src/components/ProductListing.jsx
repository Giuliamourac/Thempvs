import CatalogCard from './CatalogCard.jsx';
import FilterSidebar from './FilterSidebar.jsx';

/**
 * Estrutura única das listagens de produtos (Produtos, Sale e Movement):
 * banner + título + filtros laterais + grade + "Carregar mais produtos".
 * Quem usa decide de onde vêm os produtos e quais filtros se aplicam; aqui só se desenha.
 *
 * Props:
 *  titulo, banner ({ src, alt }), faixa (banner baixo, usado em Sale/Movement)
 *  grupos, onAlternar            → FilterSidebar
 *  ordens, ordem, onOrdem        → opcional: select "Ordenar por"
 *  total, loading, error, onRetry, itens
 *  temMais, carregandoMais, onCarregarMais
 *  mensagemVazia                 → texto quando a lista está vazia
 */
export default function ProductListing({
  titulo,
  banner,
  faixa = false,
  grupos,
  onAlternar,
  ordens,
  ordem,
  onOrdem,
  total,
  loading,
  error,
  onRetry,
  itens,
  temMais,
  carregandoMais,
  onCarregarMais,
  mensagemVazia = 'Nenhum produto encontrado para os filtros selecionados.',
}) {
  return (
    <div className="page-products">
      <main>
        <section className={`hero${faixa ? ' hero--faixa' : ''}`}>
          <img src={banner.src} alt={banner.alt ?? 'hero'} />
        </section>

        <section className="vitrine">
          <h2 className="titulo-secao">{titulo}</h2>

          <div className="vitrine-container">
            <FilterSidebar grupos={grupos} onAlternar={onAlternar} />

            <div className="conteudo-produtos">
              <div className="barra-ordem">
                <p aria-live="polite">
                  {!loading && !error && `${total} ${total === 1 ? 'produto' : 'produtos'}`}
                </p>
                {ordens && (
                  <label>
                    Ordenar por{' '}
                    <select value={ordem} onChange={(e) => onOrdem(e.target.value)}>
                      {ordens.map((o) => (
                        <option key={o.valor} value={o.valor}>
                          {o.rotulo}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              <div className="grade-produtos">
                {loading && <p className="estado-vazio">Carregando produtos...</p>}

                {error && (
                  <div className="estado-erro-grade">
                    <p>{error}</p>
                    <button type="button" className="botao-padrao" onClick={onRetry}>
                      Tentar novamente
                    </button>
                  </div>
                )}

                {!loading && !error && itens.length === 0 && <p className="estado-vazio">{mensagemVazia}</p>}

                {itens.map((produto) => (
                  <CatalogCard key={produto.id} produto={produto} />
                ))}
              </div>

              {temMais && (
                <div className="container-carregar-mais">
                  <button
                    type="button"
                    className="botao-carregar-mais"
                    disabled={carregandoMais}
                    onClick={onCarregarMais}
                  >
                    {carregandoMais ? 'Carregando...' : 'Carregar mais produtos'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
