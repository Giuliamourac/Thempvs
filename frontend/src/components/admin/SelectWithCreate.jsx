import { useState } from 'react';

export default function SelectWithCreate({ id, value, onChange, opcoes, onCriar, vazio, rotuloCriar, className, ...resto }) {
  const [criando, setCriando] = useState(false);
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const criar = async () => {
    if (nome.trim().length < 2) {
      setErro('Digite ao menos 2 letras.');
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      const novo = await onCriar(nome.trim());
      onChange(novo.slug);
      setCriando(false);
      setNome('');
    } catch (e) {
      setErro(e?.userMessage ?? 'Não foi possível criar.');
    } finally {
      setSalvando(false);
    }
  };

  if (criando) {
    return (
      <div>
        <div className="admin-imagem-linha">
          <input
            id={id}
            type="text"
            className="admin-input"
            maxLength={100}
            placeholder={rotuloCriar}
            aria-label={rotuloCriar}
            value={nome}
            autoFocus
            onChange={(e) => setNome(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                criar();
              }
              if (e.key === 'Escape') setCriando(false);
            }}
          />
          <button type="button" className="admin-botao pequeno" disabled={salvando} onClick={criar}>
            {salvando ? 'Criando...' : 'Criar'}
          </button>
          <button type="button" className="admin-botao pequeno secundario" onClick={() => setCriando(false)}>
            Cancelar
          </button>
        </div>
        {erro && (
          <p className="admin-erro-campo" role="alert">
            {erro}
          </p>
        )}
      </div>
    );
  }

  return (
    <select
      id={id}
      className={className}
      value={value}
      onChange={(e) => (e.target.value === '__novo__' ? setCriando(true) : onChange(e.target.value))}
      {...resto}
    >
      <option value="">{vazio}</option>
      {opcoes.map((o) => (
        <option key={o.slug} value={o.slug}>
          {o.nome}
        </option>
      ))}
      <option value="__novo__">+ {rotuloCriar}</option>
    </select>
  );
}
