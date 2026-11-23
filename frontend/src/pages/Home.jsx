import { Link } from 'react-router-dom';
import { ICONE_REDE } from '../components/Icons.jsx';
import ProductCarousel from '../components/ProductCarousel.jsx';
import { REDES_SOCIAIS } from '../constants/contact.js';
import { useProducts } from '../hooks/useProducts.js';
import { emPromocao } from '../utils/listing.js';
import bannerHome from '../assets/banners/home.svg';
import bannerConheca from '../assets/banners/conheca.jpg';
import imgDanca from '../assets/banners/categoria-danca.jpg';
import imgCamisetas from '../assets/banners/categoria-camisetas.jpg';
import imgConjuntos from '../assets/banners/categoria-conjuntos.jpg';
import imgCalcas from '../assets/banners/categoria-calcas.jpg';
import imgAcessorios from '../assets/banners/categoria-acessorios.jpg';

const POR_VITRINE = 8;
const PARAMS_HOME = { limite: 2 * POR_VITRINE }; // os produtos mais recentes cadastrados (alimentam as duas vitrines)

// Categorias fixas da Home (design). Os slugs são os mesmos usados nos filtros de /produtos.
const CATEGORIAS = [
  { rotulo: 'Dança', to: '/produtos', imagem: imgDanca },
  { rotulo: 'Camisetas', to: '/produtos?categoria=camisetas', imagem: imgCamisetas },
  { rotulo: 'Conjuntos', to: '/produtos?categoria=conjuntos', imagem: imgConjuntos },
  { rotulo: 'Calças', to: '/produtos?categoria=calcas', imagem: imgCalcas },
  { rotulo: 'Acessórios', to: '/produtos?categoria=acessorios', imagem: imgAcessorios },
];

/**
 * Lançamentos: os produtos cadastrados mais recentemente (a API já devolve do mais novo ao mais antigo).
 * Se a API falhar, o aviso de erro com "Tentar novamente" aparece no lugar.
 */
function Lancamentos({ itens, loading, error, reload }) {
  if (itens.length === 0) {
    if (loading) return <p className="estado-pagina">Carregando produtos...</p>;
    if (!error) return <p className="estado-pagina">Nenhum produto cadastrado ainda.</p>;
  }

  return (
    <>
      {itens.length > 0 && <ProductCarousel titulo="Lançamentos" produtos={itens.slice(0, POR_VITRINE)} />}

      {error && (
        <div className="estado-pagina">
          <p className="estado-erro">{error}</p>
          <button type="button" className="botao-padrao" onClick={reload}>
            Tentar novamente
          </button>
        </div>
      )}
    </>
  );
}

/**
 * Destaques: a tabela produtos não tem um campo "destaque", então entram primeiro os produtos em
 * promoção e, depois, os que não aparecem em Lançamentos. Só aparece quando há produtos (o aviso de
 * carregando/erro já é mostrado pela seção de Lançamentos, acima das categorias).
 */
function Destaques({ itens }) {
  if (itens.length === 0) return null;

  // Promoções primeiro; depois o que NÃO está em Lançamentos (para as duas vitrines não repetirem
  // as mesmas peças); por fim o que sobrar.
  const emLancamentos = new Set(itens.slice(0, POR_VITRINE).map((p) => p.id));
  const promocoes = itens.filter(emPromocao);
  const outros = itens.filter((p) => !emPromocao(p));
  const emDestaque = [...promocoes, ...outros.filter((p) => !emLancamentos.has(p.id)), ...outros.filter((p) => emLancamentos.has(p.id))];

  return <ProductCarousel titulo="Destaques" produtos={emDestaque.slice(0, POR_VITRINE)} />;
}

function Categorias() {
  return (
    <section className="categorias">
      <h2>Categorias</h2>
      <ul>
        {CATEGORIAS.map(({ rotulo, to, imagem }) => (
          <li key={rotulo}>
            <Link to={to}>
              <img src={imagem} alt="" />
              <h3>{rotulo}</h3>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Home() {
  const { products, loading, error, reload } = useProducts(PARAMS_HOME);
  const itens = products; // os mais recentes cadastrados no banco

  return (
    <div className="page-home">
      <main>
        <h1 className="sr-only">THEMPVS | Moda e Estilo – loja de moda feminina</h1>

        <section className="hero">
          <img src={bannerHome} alt="THEMPVS – moda feminina e estilo" />
        </section>

        <Lancamentos itens={itens} loading={loading} error={error} reload={reload} />

        <Categorias />

        <Destaques itens={itens} />

        <section className="sobre">
          <img
            src={bannerConheca}
            alt="Equipe THEMPVS"
          />

          <h2>Conheça a Thempvs</h2>

          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur massa mauris,
            suscipit ac elit vitae, imperdiet auctor dui. In hac habitasse platea dictumst. Ut a
            tempus enim. Praesent tempor eros a lectus vehicula, quis accumsan tortor vulputate.
            Fusce a nunc convallis, malesuada est ut, tincidunt sem. Vestibulum sit amet
            consequat lorem, vitae lacinia tellus. Integer quis mauris quis ex pretium volutpat et
            sed ex. Sed interdum leo ut lorem placerat, a congue justo euismod. Quisque quis quam
            at erat lacinia luctus. Nulla facilisi. Nullam tempor eget mauris ut posuere. In
            luctus facilisis accumsan. Phasellus aliquam odio a eros iaculis sodales a sit amet
            ligula. Nullam egestas risus et pharetra fermentum. Fusce ac ex semper, ultricies
            dolor ac, hendrerit eros. Proin sodales aliquam odio aliquam suscipit. Praesent
            porttitor, lorem sed varius laoreet, lectus mi posuere eros, sit amet iaculis libero
            nibh sit amet nisi. Nam sagittis mi massa, vel pulvinar arcu tempor sed. Cras vitae
            magna nulla. Morbi posuere eget enim sed facilisis.
          </p>

          <ul className="redesSociais">
            {REDES_SOCIAIS.map(({ id, rotulo, url }) => {
              const Icone = ICONE_REDE[id];
              return (
                <li key={id}>
                  <a href={url} target="_blank" rel="noopener noreferrer" aria-label={rotulo}>
                    <Icone />
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </div>
  );
}
