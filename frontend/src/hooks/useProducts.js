import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage, getProducts, isCancel } from '../services/api.js';

export function useProducts(params = {}) {
  const [dados, setDados] = useState({ itens: [], total: 0, paginas: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const chave = JSON.stringify(params);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    getProducts(JSON.parse(chave), { signal: controller.signal })
      .then((resposta) => {
        setDados(resposta);
        setLoading(false);
      })
      .catch((err) => {
        if (isCancel(err)) return;
        setError(getErrorMessage(err));
        setLoading(false);
      });

    return () => controller.abort();
  }, [chave, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return { products: dados.itens, total: dados.total, paginas: dados.paginas, loading, error, reload };
}
