import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage, isCancel, quoteOrder } from '../services/api.js';

export function useQuote(itens, uf) {
  const [estado, setEstado] = useState({ quote: null, carregando: itens.length > 0, erro: '' });
  const [versao, setVersao] = useState(0);

  const chave = JSON.stringify([itens.map((i) => [i.variacaoId, i.quantidade]), uf || null]);

  useEffect(() => {
    if (itens.length === 0) {
      setEstado({ quote: null, carregando: false, erro: '' });
      return undefined;
    }

    const controller = new AbortController();
    setEstado((atual) => ({ ...atual, carregando: true, erro: '' }));

    const timer = setTimeout(() => {
      quoteOrder(
        itens.map((item) => ({ variacao_id: item.variacaoId, quantidade: item.quantidade })),
        uf,
        { signal: controller.signal },
      )
        .then((quote) => setEstado({ quote, carregando: false, erro: '' }))
        .catch((erro) => {
          if (isCancel(erro)) return;
          setEstado((atual) => ({ ...atual, carregando: false, erro: getErrorMessage(erro) }));
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [chave, versao]);

  const recarregar = useCallback(() => setVersao((v) => v + 1), []);

  return { ...estado, recarregar };
}
