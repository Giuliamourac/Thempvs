import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createCategory, createCollection, getCategories, getCollections } from '../services/api.js';

const CatalogContext = createContext(null);

/**
 * Categorias e coleções vindas do banco (GET /api/categorias e /api/colecoes), carregadas uma vez.
 * `criarCategoria` / `criarColecao` (admin) já atualizam a lista.
 */
export function CatalogProvider({ children }) {
  const [categorias, setCategorias] = useState([]);
  const [colecoes, setColecoes] = useState([]);
  const [pronto, setPronto] = useState(false);
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let ativo = true;
    Promise.all([getCategories(), getCollections()])
      .then(([cats, cols]) => {
        if (!ativo) return;
        setCategorias(cats);
        setColecoes(cols);
      })
      .catch(() => {
        /* sem catálogo: os selects ficam vazios e os rótulos caem no próprio slug */
      })
      .finally(() => ativo && setPronto(true));
    return () => {
      ativo = false;
    };
  }, [versao]);

  const recarregar = useCallback(() => setVersao((v) => v + 1), []);

  const criarCategoria = useCallback(async (nome) => {
    const nova = await createCategory(nome);
    setCategorias((atuais) => [...atuais, nova].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')));
    return nova;
  }, []);

  const criarColecao = useCallback(async (nome) => {
    const nova = await createCollection(nome);
    setColecoes((atuais) => [...atuais, nova].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')));
    return nova;
  }, []);

  const valor = useMemo(
    () => ({
      categorias,
      colecoes,
      pronto,
      recarregar,
      criarCategoria,
      criarColecao,
      /** Nome bonito da categoria a partir do slug (cai no próprio slug se não achar). */
      nomeDaCategoria: (slug) => categorias.find((c) => c.slug === slug)?.nome ?? slug,
    }),
    [categorias, colecoes, pronto, recarregar, criarCategoria, criarColecao],
  );

  return <CatalogContext.Provider value={valor}>{children}</CatalogContext.Provider>;
}

export function useCatalogo() {
  const contexto = useContext(CatalogContext);
  if (!contexto) throw new Error('useCatalogo precisa estar dentro de <CatalogProvider>.');
  return contexto;
}
