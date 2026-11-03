export default function Field({
  id,
  label,
  optional = false,
  error,
  help,
  className = '',
  as: Control = 'input',
  children,
  ...controlProps
}) {
  const erroId = `${id}-erro`;
  const classeControle = ['campo-input', Control === 'textarea' && 'campo-textarea', error && 'invalido']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`campo ${className}`.trim()}>
      <label htmlFor={id} className="campo-rotulo">
        {label}
        {optional && (
          <>
            {' '}
            <span className="campo-opcional">(opcional)</span>
          </>
        )}
      </label>

      <Control
        id={id}
        className={classeControle}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? erroId : undefined}
        {...controlProps}
      >
        {children}
      </Control>

      {help}

      {error && (
        <p className="campo-erro" id={erroId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
