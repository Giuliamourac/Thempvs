import { useState } from 'react';
import { normalizar } from '../../utils/format.js';

/**
 * Seleção múltipla em "chips": opções sugeridas + campo para adicionar valores próprios.
 * `value` é a lista selecionada (ex.: ['P', 'M']).
 */
export default function ChipSelector({ id, label, sugestoes, value, onChange, error, placeholder }) {
  const [novo, setNovo] = useState('');

  const jaTem = (item) => value.some((v) => normalizar(v) === normalizar(item));

  // Sugestões + itens já selecionados que não são sugestão (valores próprios).
  const opcoes = [...sugestoes, ...value.filter((v) => !sugestoes.some((s) => normalizar(s) === normalizar(v)))];

  const alternar = (item) =>
    onChange(jaTem(item) ? value.filter((v) => normalizar(v) !== normalizar(item)) : [...value, item]);

  const adicionar = () => {
    const item = novo.trim();
    if (item && !jaTem(item)) onChange([...value, item]);
    setNovo('');
  };

  return (
    <div className="admin-campo">
      <span className="admin-rotulo" id={`${id}-rotulo`}>
        {label}
      </span>

      <div className="admin-chips" role="group" aria-labelledby={`${id}-rotulo`}>
        {opcoes.map((opcao) => {
          const ativo = jaTem(opcao);
          return (
            <button
              key={opcao}
              type="button"
              className={`admin-chip${ativo ? ' ativo' : ''}`}
              aria-pressed={ativo}
              onClick={() => alternar(opcao)}
            >
              {opcao}
            </button>
          );
        })}
      </div>

      <div className="admin-chip-novo">
        <input
          id={id}
          type="text"
          className="admin-input"
          value={novo}
          maxLength={30}
          placeholder={placeholder}
          onChange={(e) => setNovo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault(); // não envia o formulário
              adicionar();
            }
          }}
          aria-label={`Adicionar ${label.toLowerCase()} personalizado`}
        />
        <button type="button" className="admin-botao secundario" onClick={adicionar}>
          Adicionar
        </button>
      </div>

      {error && (
        <p className="admin-erro-campo" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
