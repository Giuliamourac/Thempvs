import { useEffect, useState } from 'react';
import { EVENTO_API_LENTA } from '../services/api.js';

/** Faixa no topo que aparece quando o servidor demora para responder (API grátis acordando). */
export default function AvisoServidor() {
  const [lenta, setLenta] = useState(false);

  useEffect(() => {
    const aoMudar = (evento) => setLenta(Boolean(evento.detail));
    window.addEventListener(EVENTO_API_LENTA, aoMudar);
    return () => window.removeEventListener(EVENTO_API_LENTA, aoMudar);
  }, []);

  if (!lenta) return null;
  return (
    <div className="aviso-servidor" role="status" aria-live="polite">
      Acordando o servidor… isso pode levar até 1 minuto na primeira visita. Obrigado por esperar!
    </div>
  );
}
