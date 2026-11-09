import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CORES_PADRAO, TAMANHOS_PADRAO } from '../constants/catalog.js';
import { useCatalogo } from '../context/CatalogContext.jsx';
import { useAllProducts } from '../hooks/useAllProducts.js';
import { alternarNaUrl, opcoesDe } from '../utils/listing.js';
import ProductListing from './ProductListing.jsx';

const POR_PAGINA = 9; // 3 colunas x 3 linhas, como no design

/** Ordena `nomes` pela ordem sugerida (P, M, G...) e o resto em ordem alfabética. */
const ordenarPor = (nomes, padrao) =>
  [...nomes].sort((a, b) => {
    const ia = padrao.indexOf(a);
    const ib = padrao.indexOf(b);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    return a.localeCompare(b, 'pt-BR');
  });

/** [{ nome, total }] contando quantos produtos têm cada valor. */
const contar = (produtos, valoresDe) => {
  const contagem = new Map();
  for (const produto of produtos) {
    for (const valor of new Set(valoresDe(produto))) contagem.set(valor, (contagem.get(valor) ?? 0) + 1);
  }
  return contagem;
};

/**
 * Página de uma "seleção" de produtos (Sale, Movement) com a mesma aparência da listagem de Produtos.
 *
 * Os produtos da seleção são carregados do backend (useAllProducts) e os filtros da sidebar
 * (?categoria=&cor=&tamanho=, na URL como em /produtos) são aplicados aqui, então as opções
 * e as quantidades da sidebar refletem só os produtos DESTA página.
 *
 * Props:
 *  titulo, banner
 *  params   → filtros enviados ao servidor (ex.: { colecao: 'movement' }); null = ainda não dá para buscar
 *  manter   → função estável que escolhe os produtos (ex.: emPromocao)
 *  mensagemVazia
 */
export default function ScopedProductsPage({ titulo, banner, params, manter, mensagemVazia }) {
  const [urlParams, setUrlParams] = useSearchParams();
  const { nomeDaCategoria } = useCatalogo();
  const { produtos, loading, error, reload } = useAllProducts(params, manter);
  const [visiveis, setVisiveis] = useState(POR_PAGINA);

  const categorias = urlParams.getAll('categoria');
  const cores = urlParams.getAll('cor');
  const tamanhos = urlParams.getAll('tamanho');
  const chave = urlParams.toString();

  const filtrados = useMemo(() => {
    const tem = (lista, selecionados) =>
      selecionados.length === 0 || selecionados.some((s) => lista.some((v) => v.toLowerCase() === s.toLowerCase()));
    return produtos.filter(
      (p) =>
        (categorias.length === 0 || categorias.includes(p.categoria)) && tem(p.cores, cores) && tem(p.tamanhos, tamanhos),
    );
  }, [produtos, chave]);

  const grupos = useMemo(() => {
    const porCategoria = [...contar(produtos, (p) => [p.categoria])].map(([slug, total]) => ({
      slug,
      nome: nomeDaCategoria(slug),
      total,
    }));
    porCategoria.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

    const listaDe = (valoresDe, padrao) => {
      const contagem = contar(produtos, valoresDe);
      return ordenarPor(contagem.keys(), padrao).map((nome) => ({ nome, total: contagem.get(nome) }));
    };

    return [
      { nome: 'categoria', titulo: 'Peça', opcoes: opcoesDe(porCategoria, categorias, (i) => i.slug), selecionados: categorias },
      { nome: 'cor', titulo: 'Cor', opcoes: opcoesDe(listaDe((p) => p.cores, CORES_PADRAO), cores), selecionados: cores },
      { nome: 'tamanho', titulo: 'Tamanho', opcoes: opcoesDe(listaDe((p) => p.tamanhos, TAMANHOS_PADRAO), tamanhos), selecionados: tamanhos },
    ];
  }, [produtos, chave, nomeDaCategoria]);

  const alternar = (nome, valor) => {
    setVisiveis(POR_PAGINA);
    alternarNaUrl(setUrlParams, nome, valor);
  };

  return (
    <ProductListing
      titulo={titulo}
      banner={banner}
      faixa
      grupos={grupos}
      onAlternar={alternar}
      total={filtrados.length}
      loading={loading}
      error={error}
      onRetry={reload}
      itens={filtrados.slice(0, visiveis)}
      temMais={!loading && !error && filtrados.length > visiveis}
      carregandoMais={false}
      onCarregarMais={() => setVisiveis((v) => v + POR_PAGINA)}
      mensagemVazia={mensagemVazia}
    />
  );
}
