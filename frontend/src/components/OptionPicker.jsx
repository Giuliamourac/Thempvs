import { Fragment, useId } from 'react';

export default function OptionPicker({ options, value, onChange, label, isDisabled }) {
  const grupo = useId();

  return (
    <div className="tamanhos" role="radiogroup" aria-label={label}>
      {options.map((opcao, indice) => {
        const id = `${grupo}-${indice}`;
        const indisponivel = Boolean(isDisabled?.(opcao));
        return (
          <Fragment key={opcao}>
            <input
              type="radio"
              id={id}
              name={grupo}
              value={opcao}
              checked={value === opcao}
              disabled={indisponivel}
              onChange={() => onChange(opcao)}
            />
            <label htmlFor={id} className={indisponivel ? 'indisponivel' : undefined} title={indisponivel ? 'Esgotado' : undefined}>
              {opcao}
            </label>
          </Fragment>
        );
      })}
    </div>
  );
}
