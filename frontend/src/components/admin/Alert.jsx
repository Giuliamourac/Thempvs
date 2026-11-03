/** Alerta visual de sucesso ou erro. `tipo`: 'sucesso' | 'erro'. */
export default function Alert({ tipo, children, onFechar }) {
  return (
    <div className={`admin-alerta ${tipo}`} role={tipo === 'erro' ? 'alert' : 'status'}>
      <span>{children}</span>
      <button type="button" className="admin-alerta-fechar" aria-label="Fechar aviso" onClick={onFechar}>
        ×
      </button>
    </div>
  );
}
