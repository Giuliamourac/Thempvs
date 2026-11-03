/** Chave de uma combinação no objeto `estoques` do formulário. */
export const chaveEstoque = (tamanho, cor) => `${tamanho}|${cor ?? ''}`;

/**
 * Tabela "Estoque por variação": uma linha por tamanho e uma coluna por cor
 * (ou uma única coluna quando o produto não tem cores). Campo vazio vale 0.
 */
export default function StockMatrix({ tamanhos, cores, estoques, onChange, error }) {
  const colunas = cores.length > 0 ? cores : [null];

  const total = tamanhos.reduce(
    (soma, t) => soma + colunas.reduce((s, c) => s + (Number(estoques[chaveEstoque(t, c)]) || 0), 0),
    0,
  );

  return (
    <div className="admin-campo">
      <span className="admin-rotulo">
        Estoque por variação * <span className="admin-total-estoque">(total: {total})</span>
      </span>

      {tamanhos.length === 0 ? (
        <p className="admin-dica">Escolha ao menos um tamanho para informar o estoque de cada variação.</p>
      ) : (
        <div className="admin-tabela-wrap">
          <table className="admin-tabela admin-matriz">
            <thead>
              <tr>
                <th>Tamanho</th>
                {colunas.map((cor) => (
                  <th key={cor ?? 'unica'}>{cor ?? 'Estoque'}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tamanhos.map((tamanho) => (
                <tr key={tamanho}>
                  <th scope="row">{tamanho}</th>
                  {colunas.map((cor) => {
                    const chave = chaveEstoque(tamanho, cor);
                    return (
                      <td key={chave}>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          className="admin-input admin-input-estoque"
                          placeholder="0"
                          aria-label={`Estoque ${tamanho}${cor ? ` ${cor}` : ''}`}
                          value={estoques[chave] ?? ''}
                          onChange={(e) => onChange(chave, e.target.value)}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && (
        <p className="admin-erro-campo" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
