import bannerMini from '../assets/banners/produto-mini.jpg';
import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { FRETE_GRATIS_MINIMO_CENTAVOS } from '../constants/catalog.js';
import { useCart } from '../context/CartContext.jsx';
import { useCatalogo } from '../context/CatalogContext.jsx';
import { useProducts } from '../hooks/useProducts.js';
import { getErrorMessage, getProduct, isCancel } from '../services/api.js';
import { formatarCentavos, formatarMoeda, paraCentavos } from '../utils/format.js';
import { corInicial, fotoEmRetrato, imagensDaCor } from '../utils/listing.js';
import OptionPicker from '../components/OptionPicker.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Preco from '../components/Preco.jsx';
import ProductImage from '../components/ProductImage.jsx';
import { COLUNAS_MEDIDAS } from '../components/admin/MeasuresMatrix.jsx';
import Seo from '../seo/Seo.jsx';
import { jsonLdDoProduto, metaDoProduto } from '../seo/structuredData.js';

const LIMITE_DESCRICAO = 160;
const PARAMS_RECOMENDADOS = { limite: 12 }; // os 12 mais recentes bastam para as seções de sugestão

function Descricao({ texto }) {
  const [aberta, setAberta] = useState(false);
  if (!texto) return null;

  const longa = texto.length > LIMITE_DESCRICAO;
  const exibido = longa && !aberta ? `${texto.slice(0, LIMITE_DESCRICAO).trimEnd()}...` : texto;

  return (
    <p className="descricao-curta">
      {exibido}
      {longa && (
        <button type="button" className="btn-ver-mais" onClick={() => setAberta((v) => !v)}>
          {aberta ? 'Ver menos' : 'Ver mais'}
        </button>
      )}
    </p>
  );
}

const POUCAS_UNIDADES = 5;

/** Tabela de medidas do produto (vinda do painel). Só mostra as colunas que têm algum valor. */
function TabelaMedidas({ medidas }) {
  const colunas = COLUNAS_MEDIDAS.filter(([campo]) => medidas.some((linha) => linha[campo] !== null));
  if (medidas.length === 0 || colunas.length === 0) return null;

  return (
    <div className="tabela-medidas-container">
      <h3>Tabela de Medidas</h3>
      <table className="tabela-medidas">
        <thead>
          <tr>
            <th>Tamanho</th>
            {colunas.map(([campo, rotulo]) => (
              <th key={campo}>{rotulo}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {medidas.map((linha) => (
            <tr key={linha.tamanho}>
              <td>{linha.tamanho}</td>
              {colunas.map(([campo]) => (
                <td key={campo}>{linha[campo] === null ? '—' : `${String(linha[campo]).replace('.', ',')} cm`}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Imagem grande + miniaturas clicáveis das fotos da cor escolhida (o pai remonta a galeria ao trocar de cor). */
function Galeria({ produto, cor }) {
  const imagens = imagensDaCor(produto, cor);
  const [indice, setIndice] = useState(0);
  const atual = Math.min(indice, imagens.length - 1);

  return (
    <div className="galeria-produto">
      {imagens.length > 1 && (
        <div className="miniaturas" role="group" aria-label="Imagens do produto">
          {imagens.map((src, i) => (
            <button
              key={src}
              type="button"
              className="miniatura"
              aria-label={`Ver imagem ${i + 1} de ${imagens.length}`}
              aria-current={i === atual}
              onClick={() => setIndice(i)}
            >
              <ProductImage src={src} alt="" />
            </button>
          ))}
        </div>
      )}

      <div className={`imagem-destaque${fotoEmRetrato(produto) ? ' imagem-destaque--retrato' : ''}`}>
        <ProductImage src={imagens[atual]} alt={produto.nome} loading="eager" />
      </div>
    </div>
  );
}

function ProdutoInfo({ produto, cor, onCorChange }) {
  const { adicionar } = useCart();
  const { nomeDaCategoria } = useCatalogo();
  const variacoes = produto.variacoes ?? [];
  const temCores = produto.cores.length > 0;

  // Estoque da combinação tamanho + cor (0 se ela não existe).
  const estoqueDe = (t, c) =>
    variacoes.find((v) => v.tamanho === t && (!temCores || v.cor === c))?.estoque ?? 0;

  const [tamanho, setTamanho] = useState(() => {
    const unico = produto.tamanhos.length === 1 ? produto.tamanhos[0] : '';
    return unico && estoqueDe(unico, produto.cores.find((c) => estoqueDe(unico, c) > 0) ?? produto.cores[0] ?? '') > 0 ? unico : '';
  });
  const [aviso, setAviso] = useState({ tipo: '', texto: '' });

  const esgotado = produto.estoque === 0;
  const variacao = tamanho ? variacoes.find((v) => v.tamanho === tamanho && (!temCores || v.cor === cor)) : null;
  const estoqueEscolhido = variacao?.estoque ?? null;
  const semEstoqueNaEscolha = estoqueEscolhido === 0;

  const aoEscolherCor = (nova) => {
    onCorChange(nova);
    setAviso({ tipo: '', texto: '' });
    // Se o tamanho escolhido não existe nessa cor, desmarca.
    if (tamanho && estoqueDe(tamanho, nova) === 0) setTamanho('');
  };

  const aoAdicionar = () => {
    if (!tamanho || !variacao) {
      setAviso({ tipo: 'erro', texto: 'Escolha um tamanho antes de adicionar ao carrinho.' });
      return;
    }

    const resultado = adicionar({
      variacaoId: variacao.id,
      produtoId: String(produto.id),
      nome: produto.nome,
      precoCentavos: paraCentavos(produto.preco_final), // estimativa; o servidor recalcula
      cor,
      tamanho,
      imagem: imagensDaCor(produto, cor)[0] ?? '', // foto da cor escolhida
      estoque: variacao.estoque,
      quantidade: 1,
    });

    if (!resultado.ok) setAviso({ tipo: 'erro', texto: 'Não foi possível adicionar o produto.' });
    else if (resultado.limitado) {
      setAviso({ tipo: 'ok', texto: 'Você já tem todas as unidades disponíveis deste item no carrinho.' });
    } else setAviso({ tipo: 'ok', texto: 'Produto adicionado ao carrinho.' });
  };

  return (
    <div className="info-compra">
      {produto.colecao && (
        <Link className="tag-colecao" to={`/produtos?colecao=${encodeURIComponent(produto.colecao.slug)}`}>
          {produto.colecao.nome}
        </Link>
      )}
      <h1 className="titulo-produto-detalhe">{produto.nome}</h1>

      <Descricao texto={produto.descricao} />

      <div className="preco-container">
        <Preco produto={produto} className="preco-atual" />{' '}
        <span className="tag-pix">No Pix</span>
        <p className="preco-parcelado">Ou 3x de {formatarMoeda(produto.preco_final / 3)}</p>
        <p className="frete-aviso">
          Frete Grátis a partir de {formatarCentavos(FRETE_GRATIS_MINIMO_CENTAVOS)}
        </p>
      </div>

      {produto.cores.length > 1 && (
        <div className="seletor-cor">
          <p className="seletor-rotulo">Cor</p>
          <OptionPicker
            options={produto.cores}
            value={cor}
            onChange={aoEscolherCor}
            label="Cores"
            // Produto sem estoque nenhum: deixa trocar de cor mesmo assim (as fotos mudam); senão só libera cores com estoque.
            isDisabled={(c) => !esgotado && !produto.tamanhos.some((t) => estoqueDe(t, c) > 0)}
          />
        </div>
      )}

      {produto.cores.length === 1 && (
        <div className="seletor-cor">
          <p className="seletor-rotulo">Cor: {produto.cores[0]}</p>
        </div>
      )}

      <div className="seletor-tamanho">
        <p className="seletor-rotulo">Tamanho</p>
        <OptionPicker
          options={produto.tamanhos}
          value={tamanho}
          onChange={(valor) => {
            setTamanho(valor);
            setAviso({ tipo: '', texto: '' });
          }}
          label="Tamanhos"
          isDisabled={(t) => estoqueDe(t, cor) === 0}
        />
      </div>

      {esgotado && <p className="aviso-esgotado">Produto esgotado</p>}
      {!esgotado && estoqueEscolhido !== null && estoqueEscolhido > 0 && estoqueEscolhido <= POUCAS_UNIDADES && (
        <p className="aviso-poucas-unidades">
          {estoqueEscolhido === 1 ? 'Resta apenas 1 unidade!' : `Restam apenas ${estoqueEscolhido} unidades!`}
        </p>
      )}

      <button
        type="button"
        className="btn-adicionar-carrinho"
        disabled={esgotado || semEstoqueNaEscolha}
        onClick={aoAdicionar}
      >
        {semEstoqueNaEscolha ? 'Indisponível' : 'Adicionar ao carrinho'}
      </button>

      {aviso.texto && (
        <p className="aviso-carrinho" role="status">
          {aviso.texto}{' '}
          {aviso.tipo === 'ok' && (
            <Link to="/carrinho" className="link-ver-mais">
              Ver carrinho
            </Link>
          )}
        </p>
      )}

      <div className="especificacoes">
        <h3>Especificações</h3>
        <ul>
          <li>
            <strong>Categoria:</strong> {nomeDaCategoria(produto.categoria)}
          </li>
          {produto.cores.length > 0 && (
            <li>
              <strong>{produto.cores.length > 1 ? 'Cores' : 'Cor'}:</strong> {produto.cores.join(', ')}
            </li>
          )}
          <li>
            <strong>Tamanhos:</strong> {produto.tamanhos.join(', ')}
          </li>
          <li>
            <strong>Disponibilidade:</strong> {esgotado ? 'Esgotado' : 'Em estoque'}
          </li>
        </ul>
      </div>

      <TabelaMedidas medidas={produto.medidas} />

      <div className="politica-troca">
        <p>Política de Troca e Devolução</p>
      </div>
    </div>
  );
}

/** Galeria + compra lado a lado; a cor escolhida troca as fotos e vai para o carrinho. */
function DetalheProduto({ produto }) {
  const [cor, setCor] = useState(() => corInicial(produto));

  return (
    <section className="detalhe-produto">
      <Galeria key={cor} produto={produto} cor={cor} />
      <ProdutoInfo produto={produto} cor={cor} onCorChange={setCor} />
    </section>
  );
}

function Secao({ titulo, produtos }) {
  if (produtos.length === 0) return null;
  return (
    <section>
      <h2 className="titulo-secao-centro">{titulo}</h2>
      <div className="grade-produtos-4">
        {produtos.map((produto) => (
          <ProductCard key={produto.id} produto={produto} />
        ))}
      </div>
    </section>
  );
}

export default function ProductDetail() {
  const { ref } = useParams();
  const { nomeDaCategoria } = useCatalogo();
  const { products } = useProducts(PARAMS_RECOMENDADOS);
  // `ref` guarda de qual endereço é este resultado: ao clicar em outro produto o `ref` muda ANTES do efeito
  // rodar, e sem essa checagem o produto antigo ainda em memória faria o <Navigate> abaixo voltar para ele.
  const [estado, setEstado] = useState({ ref: null, status: 'carregando', produto: null, erro: '' });

  useEffect(() => {
    const controller = new AbortController();
    setEstado({ ref, status: 'carregando', produto: null, erro: '' });

    getProduct(ref, { signal: controller.signal })
      .then((produto) => setEstado({ ref, status: 'ok', produto, erro: '' }))
      .catch((erro) => {
        if (isCancel(erro)) return;
        const naoEncontrado = erro.response?.status === 404 || erro.response?.status === 400;
        setEstado({
          ref,
          status: naoEncontrado ? 'nao-encontrado' : 'erro',
          produto: null,
          erro: getErrorMessage(erro),
        });
      });

    return () => controller.abort();
  }, [ref]);

  if (estado.ref !== ref || estado.status === 'carregando') {
    return <p className="estado-pagina">Carregando produto...</p>;
  }

  if (estado.status !== 'ok') {
    return (
      <main className="estado-pagina">
        {/* Só "não encontrado" recebe noindex; num erro de rede nada é alterado (evita desindexar por falha temporária). */}
        {estado.status === 'nao-encontrado' && (
          <Seo title="Produto não encontrado | THEMPVS" path={null} noindex />
        )}
        <h1>{estado.status === 'nao-encontrado' ? 'Produto não encontrado' : 'Algo deu errado'}</h1>
        {estado.status === 'erro' && <p className="estado-erro">{estado.erro}</p>}
        <p>
          <Link to="/produtos">Voltar para os produtos</Link>
        </p>
      </main>
    );
  }

  const produto = estado.produto;

  // Link antigo (/produtos/12): vai para o endereço bonito (/produtos/camiseta-preta).
  if (ref !== produto.slug) return <Navigate to={`/produtos/${produto.slug}`} replace />;

  const todos = products; // sugestões: os produtos mais recentes da loja
  const outros = todos.filter((p) => p.id !== produto.id);
  const mesmaCategoria = outros.filter((p) => p.categoria === produto.categoria);
  const recomendados = [...mesmaCategoria, ...outros.filter((p) => p.categoria !== produto.categoria)].slice(0, 4);
  const lancamentos = todos.slice(0, 4);

  const metaSeo = metaDoProduto(produto);
  const imagemSeo = produto.imagens?.find((src) => !String(src).startsWith('data:')) ?? produto.imagem_url;

  return (
    <div className="page-detail">
      <Seo
        title={metaSeo.title}
        description={metaSeo.description}
        path={metaSeo.path}
        image={imagemSeo && !String(imagemSeo).startsWith('data:') ? imagemSeo : undefined}
        imageAlt={produto.nome}
        type="product"
        jsonLd={jsonLdDoProduto(produto, nomeDaCategoria(produto.categoria))}
      />
      <section className="mini-banner">
        <img src={bannerMini} alt="" />
      </section>

      <main className="container-produto">
        <DetalheProduto key={produto.id} produto={produto} />

        <Secao titulo="Você também pode gostar!" produtos={recomendados} />
        <Secao titulo="Lançamentos" produtos={lancamentos} />
      </main>
    </div>
  );
}
