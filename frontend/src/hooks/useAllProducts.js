import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage, getProducts, isCancel } from '../services/api.js';

const POR_REQUISICAO = 100; // máximo aceito por GET /api/products

/**
 * Carrega TODOS os produtos que o servidor devolve para `params` (percorrendo as páginas),
 * opcionalmente mantendo só os que passam em `manter` (função estável, definida fora do componente).
 *
 * Usado por Sale e Movement: o backend não tem filtro "em promoção", então a seleção
 * é feita aqui; para Movement o filtro de coleção já é feito pelo servidor (?colecao=slug).
 * Se `params` for null, não busca nada (ex.: esperando o catálogo carregar).
 */
export function useAllProducts(params, manter) {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const chave = params ? JSON.stringify(params) : null;

  useEffect(() => {
    if (chave === null) return undefined;

    const controller = new AbortController();
    setLoading(true);
    setError('');

    (async () => {
      const todos = [];
      let pagina = 1;
      let paginas = 1;
      do {
        const resposta = await getProducts(
          { ...JSON.parse(chave), pagina, limite: POR_REQUISICAO },
          { signal: controller.signal },
        );
        todos.push(...resposta.itens);
        paginas = resposta.paginas;
        pagina += 1;
      } while (pagina <= paginas);
      return todos;
    })()
      .then((todos) => {
        setProdutos(manter ? todos.filter(manter) : todos);
        setLoading(false);
      })
      .catch((err) => {
        if (isCancel(err)) return;
        setError(getErrorMessage(err));
        setLoading(false);
      });

    return () => controller.abort();
  }, [chave, manter, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return { produtos, loading: chave === null ? true : loading, error, reload };
}
