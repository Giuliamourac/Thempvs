import { Link } from 'react-router-dom';
import { useCatalogo } from '../context/CatalogContext.jsx';
import { useProducts } from '../hooks/useProducts.js';
import ProductCarousel from '../components/ProductCarousel.jsx';

const REDES = [
  { rotulo: 'Instagram', sigla: 'IG' },
  { rotulo: 'Facebook', sigla: 'FB' },
  { rotulo: 'Tiktok', sigla: 'TK' },
];

const POR_VITRINE = 8;
const PARAMS_HOME = { limite: POR_VITRINE * 2 }; 

function Vitrines({ products, loading, error, reload }) {
  if (loading) {
    return <p className="estado-pagina">Carregando produtos...</p>;
  }

  if (error) {
    return (
      <div className="estado-pagina">
        <p className="estado-erro">{error}</p>
        <button type="button" className="botao-padrao" onClick={reload}>
          Tentar novamente
        </button>
      </div>
    );
  }

  const lancamentos = products.slice(0, POR_VITRINE);
  const destaques = products.slice(POR_VITRINE, POR_VITRINE * 2);

  if (lancamentos.length === 0) {
    return <p className="estado-pagina">Nenhum produto cadastrado ainda.</p>;
  }

  return (
    <>
      <ProductCarousel titulo="Lançamentos" produtos={lancamentos} />
      <Categorias />
      {destaques.length > 0 && <ProductCarousel titulo="Destaques" produtos={destaques} />}
    </>
  );
}

function Categorias() {
  const { categorias } = useCatalogo();
  const itens = [
    { rotulo: 'Dança', to: '/produtos' },
    ...categorias
      .filter((c) => c.total_produtos > 0)
      .slice(0, 4)
      .map((c) => ({ rotulo: c.nome, to: `/produtos?categoria=${encodeURIComponent(c.slug)}` })),
  ];

  return (
    <section className="categorias">
      <h2>Categorias</h2>
      <ul>
        {itens.map(({ rotulo, to }) => (
          <li key={rotulo}>
            <Link to={to}>
              <img
                src="https://placehold.co/470x450/4a4a4a/ffffff?text=Categoria"
                alt=""
              />
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

  return (
    <div className="page-home">
      <main>
        <section className="hero">
          <img src="https://placehold.co/1440x548/484848/ffffff?text=Banner" alt="hero" />
        </section>

        <Vitrines products={products} loading={loading} error={error} reload={reload} />

        <section className="sobre">
          <img
            src="https://placehold.co/1280x440/e8e8e8/484848?text=Banner+Thempvs"
            alt="Equipe Thempvs"
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
            {REDES.map(({ rotulo, sigla }) => (
              <li key={rotulo}>
                <a href="#" aria-label={rotulo}>
                  <img src={`https://placehold.co/60x60/3b2a20/ffffff?text=${sigla}`} alt="" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
