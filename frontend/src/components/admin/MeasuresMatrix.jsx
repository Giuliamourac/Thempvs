/** Colunas de medida (nome do campo na API → rótulo). */
export const COLUNAS_MEDIDAS = [
  ['busto_cm', 'Busto'],
  ['cintura_cm', 'Cintura'],
  ['quadril_cm', 'Quadril'],
  ['ombros_cm', 'Ombros'],
  ['comprimento_cm', 'Comprim.'],
  ['manga_cm', 'Manga'],
  ['coxa_cm', 'Coxa'],
];

/** Tabela "Medidas (cm)": uma linha por tamanho. Tudo opcional; campo vazio = não informado. */
export default function MeasuresMatrix({ tamanhos, medidas, onChange, error }) {
  if (tamanhos.length === 0) return null;

  return (
    <div className="admin-campo">
      <span className="admin-rotulo">
        Medidas em cm <span className="admin-total-estoque">(opcional)</span>
      </span>

      <div className="admin-tabela-wrap">
        <table className="admin-tabela admin-matriz">
          <thead>
            <tr>
              <th>Tamanho</th>
              {COLUNAS_MEDIDAS.map(([, rotulo]) => (
                <th key={rotulo}>{rotulo}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tamanhos.map((tamanho) => (
              <tr key={tamanho}>
                <th scope="row">{tamanho}</th>
                {COLUNAS_MEDIDAS.map(([campo, rotulo]) => (
                  <td key={campo}>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      inputMode="decimal"
                      className="admin-input admin-input-estoque"
                      aria-label={`${rotulo} do tamanho ${tamanho} (cm)`}
                      value={medidas[tamanho]?.[campo] ?? ''}
                      onChange={(e) =>
                        onChange(tamanho, { ...(medidas[tamanho] ?? {}), [campo]: e.target.value })
                      }
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && (
        <p className="admin-erro-campo" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
