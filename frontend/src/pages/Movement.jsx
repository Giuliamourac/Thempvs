import { useMemo } from 'react';
import bannerProdutos from '../assets/banners/produtos.jpg';
import ScopedProductsPage from '../components/ScopedProductsPage.jsx';
import { useCatalogo } from '../context/CatalogContext.jsx';
import { normalizar } from '../utils/format.js';

const BANNER = { src: bannerProdutos, alt: 'Movement' };
const SLUG_PADRAO = 'movement';

/**
 * Movement = produtos da coleção "Movement" (tabela colecao). O servidor já filtra por
 * GET /api/products?colecao=<slug>; aqui só se descobre o slug real entre as coleções cadastradas.
 */
export default function Movement() {
  const { colecoes, pronto } = useCatalogo();

  const params = useMemo(() => {
    if (!pronto) return null; // espera o catálogo para saber o slug certo
    const colecao = colecoes.find(
      (c) => normalizar(c.slug) === SLUG_PADRAO || normalizar(c.nome) === SLUG_PADRAO,
    );
    return { colecao: colecao?.slug ?? SLUG_PADRAO };
  }, [colecoes, pronto]);

  return (
    <ScopedProductsPage
      titulo="Movement"
      banner={BANNER}
      params={params}
      mensagemVazia='Nenhum produto na coleção "Movement" ainda.'
    />
  );
}
