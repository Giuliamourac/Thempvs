const ICONES = {
  endereco: (
    <>
      <path d="M5 11l12-4 14 4 12-4v30l-12 4-14-4-12 4z" />
      <path d="M17 7v30M31 11v30" />
    </>
  ),
  pagamento: (
    <>
      <rect x="5" y="11" width="38" height="28" rx="5" />
      <path d="M5 19h38" />
      <path d="M30 29h8" />
    </>
  ),
  revisao: (
    <>
      <rect x="9" y="6" width="30" height="36" rx="4" />
      <path d="M16 18l4 4 8-8" />
      <path d="M16 31h16" />
    </>
  ),
};

export const ETAPAS = [
  { nome: 'endereco', titulo: 'Endereço de Entrega' },
  { nome: 'pagamento', titulo: 'Entrega e Pagamento' },
  { nome: 'revisao', titulo: 'Revisão do Pedido' },
];

/** Círculos no topo do checkout; clicar abre a etapa correspondente. */
export default function StepIndicators({ aberta, concluidas, onAbrir }) {
  return (
    <ol className="etapas" aria-label="Etapas do checkout">
      {ETAPAS.map((etapa, indice) => {
        const ativa = etapa.nome === aberta;
        const classe = ['etapas-item', ativa && 'ativa', concluidas[etapa.nome] && 'concluida']
          .filter(Boolean)
          .join(' ');

        return (
          <FragmentComLinha key={etapa.nome} mostrarLinha={indice > 0}>
            <li className={classe} aria-current={ativa ? 'step' : undefined}>
              <button
                type="button"
                className="etapas-circulo"
                aria-label={`Etapa ${indice + 1}: ${etapa.titulo}`}
                onClick={() => onAbrir(etapa.nome)}
              >
                <svg
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {ICONES[etapa.nome]}
                </svg>
              </button>
            </li>
          </FragmentComLinha>
        );
      })}
    </ol>
  );
}

// Linha de ligação entre dois círculos (um <li> decorativo, como no HTML original).
function FragmentComLinha({ mostrarLinha, children }) {
  return (
    <>
      {mostrarLinha && <li className="etapas-linha" aria-hidden="true" />}
      {children}
    </>
  );
}
