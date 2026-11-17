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
import { IconeCalendario, IconePino, IconeRelogio, ICONE_REDE } from '../components/Icons.jsx';
import { EVENTOS } from '../data/events.js';
import { REDES_SOCIAIS } from '../constants/contact.js';
import logo from '../assets/Logo1.png';

// Nomes e biografias fictícios dos dois modelos (amigos). Troque pelos dados reais quando houver.
const NOME_MODELO_1 = 'Rafael Lima';
const NOME_MODELO_2 = 'Matheus Costa';
const FUNCAO_MODELO = 'Modelo Thempus Wear';

const BIO_MODELO_1 =
  'Sempre fui apaixonado por moda, estilo e fotografia, e foi nas peças da Thempus Wear que encontrei um jeito de mostrar quem eu sou. Hoje participo dos ensaios e das divulgações da marca, e cada clique é uma chance de contar um pouco da minha personalidade, sem pose forçada, do meu jeito.';

const BIO_MODELO_2 =
  'Moda e estilo sempre fizeram parte da minha rotina, mas foi por causa de um grande amigo, que já era modelo da Thempus Wear, que o convite chegou até mim. Topei na hora, gostei do clima leve dos bastidores e, desde então, estou nas campanhas e divulgações da marca, sempre ao lado dele.';

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
            <h2 className="quemModeloNome">{NOME_MODELO_1}</h2>
            <span className="quemModeloFuncao">{FUNCAO_MODELO}</span>
            <p>{BIO_MODELO_1}</p>

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
            <h2 className="quemModeloNome">{NOME_MODELO_2}</h2>
            <span className="quemModeloFuncao">{FUNCAO_MODELO}</span>
            <p>{BIO_MODELO_2}</p>

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
              <Link
                key={evento.slug}
                to={`/quem-usa/evento/${evento.slug}`}
                className="quemEvento quemEventoLink"
                aria-label={`Ver o perfil do evento ${evento.titulo}`}
              >
                <img src={evento.banner} alt={evento.altBanner} />
                <div className="quemEventoConteudo">
                  <span className="quemEventoTag">{evento.categoria}</span>
                  <h3>{evento.titulo}</h3>
                  <ul className="quemEventoMeta">
                    <li>
                      <IconeCalendario className="quemIconeData" /> {evento.data}
                    </li>
                    <li>
                      <IconeRelogio className="quemIconeData" /> {evento.horario}
                    </li>
                    <li>
                      <IconePino className="quemIconeData" /> {evento.local}
                    </li>
                  </ul>
                  <p>{evento.descricaoCurta}</p>
                </div>
                <span className="quemEventoBotao">Ver evento →</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
