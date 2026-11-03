import { Link } from 'react-router-dom';
import logo from '../assets/Logo1.png';

const TEXTO_LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi iaculis velit nec velit dapibus feugiat. Nam convallis, urna sit amet hendrerit semper, tellus lacus ornare sem, quis lacinia nisi massa vel eros. Integer ultricies iaculis orci. Quisque bibendum aliquam ultrices. Nunc convallis, nulla in faucibus congue, dolor neque tempor ante, scelerisque rhoncus neque turpis sit amet lectus. Quisque vitae posuere ex. Pellentesque pretium lobortis purus eget suscipit. Sed purus elit, blandit vel sagittis nec, dignissim in tellus. Nam id mattis felis, vitae viverra mauris. Donec in nisi risus. Duis neque tortor, placerat quis ultricies eu, rutrum eget lectus. Proin faucibus tortor in urna eleifend, id semper mauris ullamcorper. Nunc imperdiet ante viverra, feugiat nibh nec, venenatis eros.';

const EVENTOS = [
  {
    alt: 'Pessoas participando de um evento de dança de rua',
    alternado: false,
  },
  {
    alt: 'Pessoas dançando em um evento de cultura urbana',
    alternado: true,
  },
].map((evento) => ({
  ...evento,
  titulo: 'Código de rua',
  data: '14/12/2026',
  paragrafos: [
    'Mais do que um evento, uma conexão entre ritmos, histórias e vivências que nascem nas ruas. O Código de Rua celebra a essência do hip-hop, dando voz à expressão, à arte e à resistência por meio da dança, do breaking, do graffiti e dos beats que movimentam a cultura urbana.',
    'Um espaço de atitude, criatividade e liberdade, onde cada rima carrega uma mensagem, cada batida conta uma história e cada pessoa faz parte do movimento.',
  ],
}));

const placeholder = (largura, altura, cor, texto = 'Foto') =>
  `https://placehold.co/${largura}x${altura}/${cor}/ffffff?text=${texto}`;

function IconeFacebook() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round">
      <rect x="5" y="5" width="38" height="38" rx="5" />
      <path d="M33 43V28h5l1-6h-6v-4c0-2 1-3 3-3h3v-5h-4c-5 0-7 3-7 7v5h-5v6h5v15" />
    </svg>
  );
}

function IconeInstagram() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3">
      <rect x="5" y="5" width="38" height="38" rx="11" />
      <circle cx="24" cy="24" r="9" />
      <circle cx="35" cy="13" r="1.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function WhoWears() {
  return (
    <div className="page-who-wears">
      <section className="quemBanner">
        <img src={placeholder(1440, 507, '484848', 'Banner+Thempvs')} alt="" />
      </section>

      <main className="quemUsa">
        <h1 className="quemTitulo">Quem usa, usa Thempvs</h1>

        <section className="quemBloco">
          <img className="quemFotoRedonda" src={placeholder(400, 400, '8a8a8a')} alt="" />

          <div className="quemTexto quemTextoDireita">
            <p>{TEXTO_LOREM}</p>

            <ul className="quemRedes">
              <li>
                <a href="#" aria-label="Rede social"></a>
              </li>
              <li>
                <a href="#" aria-label="Facebook">
                  <IconeFacebook />
                </a>
              </li>
            </ul>
          </div>
        </section>

        <section className="quemMosaico" aria-label="Fotos">
          <img className="mosaicoA" src={placeholder(425, 705, '6b6b6b')} alt="" />

          <div className="mosaicoColuna">
            <img src={placeholder(425, 177, '7a7a7a')} alt="" />
            <img src={placeholder(425, 370, '6b6b6b')} alt="" />
            <img src={placeholder(425, 125, '7a7a7a')} alt="" />
          </div>

          <div className="mosaicoDireita">
            <img className="mosaicoD1" src={placeholder(254, 275, '6b6b6b')} alt="" />
            <img className="mosaicoD2" src={placeholder(254, 273, '7a7a7a')} alt="" />
            <img className="mosaicoD3" src={placeholder(187, 563, '6b6b6b')} alt="" />
            <img className="mosaicoD4" src={placeholder(460, 125, '7a7a7a')} alt="" />
          </div>
        </section>

        <section className="quemBloco quemBlocoInvertido">
          <div className="quemTexto">
            <p>{TEXTO_LOREM}</p>

            <ul className="quemRedes">
              <li>
                <a href="#" aria-label="Instagram">
                  <IconeInstagram />
                </a>
              </li>
              <li>
                <a href="#" aria-label="Rede social"></a>
              </li>
            </ul>
          </div>

          <img className="quemFotoRedonda" src={placeholder(400, 400, '7a2fc9')} alt="" />
        </section>

        <section className="quemChamada">
          <h2>Saiba onde e quando achar</h2>
          <div className="quemWordmark">
            <img src={logo} alt="Thempvs" />
          </div>

          <div className="quemEventos">
            {EVENTOS.map((evento) => (
              <article
                key={evento.alt}
                className={`quemEvento${evento.alternado ? ' quemEventoAlternado' : ''}`}
              >
                <img src={placeholder(240, 160, '777777', 'Codigo+de+rua')} alt={evento.alt} />
                <div className="quemEventoConteudo">
                  <h3>{evento.titulo}</h3>
                  <p className="quemEventoData">Data: {evento.data} ▣</p>
                  {evento.paragrafos.map((paragrafo) => (
                    <p key={paragrafo}>{paragrafo}</p>
                  ))}
                </div>
                <Link className="quemEventoBotao" to="/movement">
                  Saber mais
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
