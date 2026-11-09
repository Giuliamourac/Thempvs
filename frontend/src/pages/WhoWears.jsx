import foto1 from '../assets/quem-usa/foto-1.jpg';
import foto2 from '../assets/quem-usa/foto-2.jpg';
import foto3 from '../assets/quem-usa/foto-3.jpg';
import foto4 from '../assets/quem-usa/foto-4.jpg';
import foto5 from '../assets/quem-usa/foto-5.jpg';
import foto6 from '../assets/quem-usa/foto-6.jpg';
import foto7 from '../assets/quem-usa/foto-7.jpg';
import foto8 from '../assets/quem-usa/foto-8.jpg';
import historia1 from '../assets/quem-usa/historia-1.jpg';
import historia2 from '../assets/quem-usa/historia-2.jpg';
import bannerQuemUsa from '../assets/banners/quem-usa.jpg';
import { Link } from 'react-router-dom';
import { IconeCalendario, ICONE_REDE } from '../components/Icons.jsx';
import { REDES_SOCIAIS } from '../constants/contact.js';
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

/** Instagram + Facebook (links do projeto em constants/contact.js). */
function Redes() {
  return (
    <ul className="quemRedes">
      {REDES_SOCIAIS.filter(({ id }) => id !== 'tiktok').map(({ id, rotulo, url }) => {
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
  );
}

export default function WhoWears() {
  return (
    <div className="page-who-wears">
      <section className="quemBanner">
        <img src={bannerQuemUsa} alt="" />
      </section>

      <main className="quemUsa">
        <h1 className="quemTitulo">Quem usa, usa Thempvs</h1>

        {/* Primeiro bloco: foto à esquerda, texto à direita */}
        <section className="quemBloco">
          <img className="quemFotoRedonda" src={historia1} alt="" />

          <div className="quemTexto quemTextoDireita">
            <p>{TEXTO_LOREM}</p>

            <Redes />
          </div>
        </section>

        {/* Mosaico de fotos */}
        <section className="quemMosaico" aria-label="Fotos">
          <img className="mosaicoA" src={foto1} alt="" />

          <div className="mosaicoColuna">
            <img src={foto2} alt="" />
            <img src={foto3} alt="" />
            <img src={foto4} alt="" />
          </div>

          <div className="mosaicoDireita">
            <img className="mosaicoD1" src={foto5} alt="" />
            <img className="mosaicoD2" src={foto6} alt="" />
            <img className="mosaicoD3" src={foto7} alt="" />
            <img className="mosaicoD4" src={foto8} alt="" />
          </div>
        </section>

        {/* Segundo bloco: texto à esquerda, foto à direita */}
        <section className="quemBloco quemBlocoInvertido">
          <div className="quemTexto">
            <p>{TEXTO_LOREM}</p>

            <Redes />
          </div>

          <img className="quemFotoRedonda" src={historia2} alt="" />
        </section>

        {/* Chamada final */}
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
                  <p className="quemEventoData">Data: {evento.data} <IconeCalendario className="quemIconeData" /></p>
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
