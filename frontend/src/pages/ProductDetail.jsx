import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { FRETE_GRATIS_MINIMO_CENTAVOS } from '../constants/catalog.js';
import { useCart } from '../context/CartContext.jsx';
import { useCatalogo } from '../context/CatalogContext.jsx';
import { useProducts } from '../hooks/useProducts.js';
import { getErrorMessage, getProduct, isCancel } from '../services/api.js';
import { formatarCentavos, formatarMoeda, paraCentavos } from '../utils/format.js';
import OptionPicker from '../components/OptionPicker.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Preco from '../components/Preco.jsx';
import ProductImage from '../components/ProductImage.jsx';
import { COLUNAS_MEDIDAS } from '../components/admin/MeasuresMatrix.jsx';

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

/** Imagem grande + miniaturas clicáveis (a primeira é a capa). */
function Galeria({ produto }) {
  const imagens = produto.imagens.length ? produto.imagens : [produto.imagem_url];
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

      <div className="imagem-destaque">
        <ProductImage src={imagens[atual]} alt={produto.nome} loading="eager" />
      </div>
    </div>
  );
}

function ProdutoInfo({ produto }) {
  const { adicionar } = useCart();
  const { nomeDaCategoria } = useCatalogo();
  const variacoes = produto.variacoes ?? [];
  const temCores = produto.cores.length > 0;

  // Estoque da combinação tamanho + cor (0 se ela não existe).
  const estoqueDe = (t, c) =>
    variacoes.find((v) => v.tamanho === t && (!temCores || v.cor === c))?.estoque ?? 0;

  const [cor, setCor] = useState(() => produto.cores.find((c) => produto.tamanhos.some((t) => estoqueDe(t, c) > 0)) ?? produto.cores[0] ?? '');
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
    setCor(nova);
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
      imagem: produto.imagem_url ?? '',
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
            isDisabled={(c) => !produto.tamanhos.some((t) => estoqueDe(t, c) > 0)}
          />
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
  const { products } = useProducts(PARAMS_RECOMENDADOS);
  const [estado, setEstado] = useState({ status: 'carregando', produto: null, erro: '' });

  useEffect(() => {
    const controller = new AbortController();
    setEstado({ status: 'carregando', produto: null, erro: '' });

    getProduct(ref, { signal: controller.signal })
      .then((produto) => setEstado({ status: 'ok', produto, erro: '' }))
      .catch((erro) => {
        if (isCancel(erro)) return;
        const naoEncontrado = erro.response?.status === 404 || erro.response?.status === 400;
        setEstado({
          status: naoEncontrado ? 'nao-encontrado' : 'erro',
          produto: null,
          erro: getErrorMessage(erro),
        });
      });

    return () => controller.abort();
  }, [ref]);

  if (estado.status === 'carregando') {
    return <p className="estado-pagina">Carregando produto...</p>;
  }

  if (estado.status !== 'ok') {
    return (
      <main className="estado-pagina">
        <h1>{estado.status === 'nao-encontrado' ? 'Produto não encontrado' : 'Algo deu errado'}</h1>
        {estado.status === 'erro' && <p className="estado-erro">{estado.erro}</p>}
        <p>
          <Link to="/produtos">Voltar para os produtos</Link>
        </p>
      </main>
    );
  }

  const { produto } = estado;

  // Link antigo (/produtos/12): vai para o endereço bonito (/produtos/camiseta-preta).
  if (ref !== produto.slug) return <Navigate to={`/produtos/${produto.slug}`} replace />;

  const outros = products.filter((p) => p.id !== produto.id);
  const mesmaCategoria = outros.filter((p) => p.categoria === produto.categoria);
  const recomendados = [...mesmaCategoria, ...outros.filter((p) => p.categoria !== produto.categoria)].slice(0, 4);
  const lancamentos = products.slice(0, 4);

  return (
    <div className="page-detail">
      <section className="mini-banner">
        <img src="https://placehold.co/1440x200/484848/ffffff?text=Mini+Banner" alt="" />
      </section>

      <main className="container-produto">
        <section className="detalhe-produto">
          <Galeria key={`galeria-${produto.id}`} produto={produto} />

          <ProdutoInfo key={`info-${produto.id}`} produto={produto} />
        </section>

        <Secao titulo="Você também pode gostar!" produtos={recomendados} />
        <Secao titulo="Lançamentos" produtos={lancamentos} />
      </main>
    </div>
  );
}
