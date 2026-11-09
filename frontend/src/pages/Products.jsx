import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getErrorMessage, getProductFilters, getProducts, isCancel } from '../services/api.js';
import ProductListing from '../components/ProductListing.jsx';
import bannerProdutos from '../assets/banners/produtos.jpg';
import { alternarNaUrl, opcoesDe } from '../utils/listing.js';

const POR_PAGINA = 12;

const ORDENS = [
  { valor: 'recentes', rotulo: 'Mais recentes' },
  { valor: 'menor_preco', rotulo: 'Menor preço' },
  { valor: 'maior_preco', rotulo: 'Maior preço' },
  { valor: 'nome', rotulo: 'Nome (A–Z)' },
];

/**
 * Os filtros ficam na URL (?categoria=camisetas&cor=Preto&tamanho=M&q=jaqueta&ordem=menor_preco):
 * dá para compartilhar o link, o botão "voltar" funciona e os links do rodapé/home
 * já abrem a listagem filtrada. Quem filtra, ordena e pagina é o SERVIDOR.
 */
export default function Products() {
  const [params, setParams] = useSearchParams();
  const [facetas, setFacetas] = useState(null);
  const [lista, setLista] = useState({ itens: [], total: 0, paginas: 1, pagina: 0 });
  const [loading, setLoading] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [error, setError] = useState('');
  const [versao, setVersao] = useState(0);

  const categorias = params.getAll('categoria');
  const cores = params.getAll('cor');
  const tamanhos = params.getAll('tamanho');
  const busca = params.get('q') ?? '';
  const colecao = params.get('colecao') ?? '';
  const ordem = ORDENS.some((o) => o.valor === params.get('ordem')) ? params.get('ordem') : 'recentes';

  // Muda sempre que qualquer filtro/ordem muda (os arrays acima são recriados a cada render).
  const chaveDosFiltros = params.toString();
  const filtros = useMemo(
    () => ({ categoria: categorias, cor: cores, tamanho: tamanhos, q: busca, colecao, ordem }),
    [chaveDosFiltros],
  );

  useEffect(() => {
    const controller = new AbortController();
    getProductFilters({ signal: controller.signal })
      .then(setFacetas)
      .catch(() => {
        /* sem facetas a sidebar fica só com o que está marcado na URL */
      });
    return () => controller.abort();
  }, [versao]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    getProducts({ ...filtros, pagina: 1, limite: POR_PAGINA }, { signal: controller.signal })
      .then((resposta) => {
        setLista({ itens: resposta.itens, total: resposta.total, paginas: resposta.paginas, pagina: 1 });
        setLoading(false);
      })
      .catch((erro) => {
        if (isCancel(erro)) return;
        setError(getErrorMessage(erro));
        setLoading(false);
      });

    return () => controller.abort();
  }, [filtros, versao]);

  const carregarMais = useCallback(async () => {
    setCarregandoMais(true);
    try {
      const resposta = await getProducts({ ...filtros, pagina: lista.pagina + 1, limite: POR_PAGINA });
      setLista((atual) => ({
        itens: [...atual.itens, ...resposta.itens.filter((novo) => !atual.itens.some((i) => i.id === novo.id))],
        total: resposta.total,
        paginas: resposta.paginas,
        pagina: resposta.pagina,
      }));
    } catch (erro) {
      setError(getErrorMessage(erro));
    } finally {
      setCarregandoMais(false);
    }
  }, [filtros, lista.pagina]);

  const grupos = useMemo(
    () => [
      { nome: 'categoria', titulo: 'Peça', opcoes: opcoesDe(facetas?.categorias, categorias, (i) => i.slug), selecionados: categorias },
      { nome: 'cor', titulo: 'Cor', opcoes: opcoesDe(facetas?.cores, cores), selecionados: cores },
      { nome: 'tamanho', titulo: 'Tamanho', opcoes: opcoesDe(facetas?.tamanhos, tamanhos), selecionados: tamanhos },
    ],
    [facetas, chaveDosFiltros],
  );

  const alternarFiltro = (nome, valor) => alternarNaUrl(setParams, nome, valor);

  const mudarOrdem = (nova) => {
    setParams(
      (atual) => {
        const proximo = new URLSearchParams(atual);
        if (nova === 'recentes') proximo.delete('ordem');
        else proximo.set('ordem', nova);
        return proximo;
      },
      { replace: true },
    );
  };

  const temMais = !loading && !error && lista.pagina < lista.paginas;

  return (
    <ProductListing
      titulo={busca ? `Resultados para "${busca}"` : 'Lançamentos'}
      banner={{ src: bannerProdutos, alt: 'Thempvs' }}
      grupos={grupos}
      onAlternar={alternarFiltro}
      ordens={ORDENS}
      ordem={ordem}
      onOrdem={mudarOrdem}
      total={lista.total}
      loading={loading}
      error={error}
      onRetry={() => setVersao((v) => v + 1)}
      itens={lista.itens}
      temMais={temMais}
      carregandoMais={carregandoMais}
      onCarregarMais={carregarMais}
    />
  );
}
