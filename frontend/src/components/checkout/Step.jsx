export default function Step({ nome, titulo, aberta, onAlternar, children }) {
  const botaoId = `botaoEtapa-${nome}`;
  const painelId = `painelEtapa-${nome}`;

  return (
    <section className={`etapa${aberta ? ' aberta' : ''}`} data-etapa={nome}>
      <h2 className="etapa-titulo">
        <button
          type="button"
          className="etapa-botao"
          id={botaoId}
          aria-expanded={aberta}
          aria-controls={painelId}
          onClick={onAlternar}
        >
          {titulo}
        </button>
      </h2>
      <div className="etapa-painel" id={painelId} role="region" aria-labelledby={botaoId}>
        <div className="etapa-painel-interno">{children}</div>
      </div>
    </section>
  );
}
