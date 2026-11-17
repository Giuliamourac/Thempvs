import { Link, useParams } from 'react-router-dom';
import { IconeCalendario, IconePino, IconeRelogio } from '../components/Icons.jsx';
import { buscarEvento } from '../data/events.js';

/** Perfil do evento: página de detalhes aberta a partir do card em "Quem Usa". */
export default function EventProfile() {
  const { slug } = useParams();
  const evento = buscarEvento(slug);

  if (!evento) {
    return (
      <main className="estado-pagina">
        <h1>Evento não encontrado</h1>
        <p>Este evento não existe ou já foi encerrado.</p>
        <p>
          <Link to="/quem-usa">Voltar para Quem Usa</Link>
        </p>
      </main>
    );
  }

  return (
    <div className="page-event">
      <section className="quemBanner eventoBanner">
        <img src={evento.banner} alt={evento.altBanner} />
      </section>

      <main className="eventoPerfil">
        <Link to="/quem-usa" className="eventoVoltar">
          <span aria-hidden="true">←</span> Voltar para Quem Usa
        </Link>

        <header className="eventoCabecalho">
          <span className="quemEventoTag">{evento.categoria}</span>
          <h1>{evento.tituloCompleto}</h1>
          <p className="eventoResumo">{evento.descricaoCurta}</p>
        </header>

        <ul className="eventoFatos" aria-label="Data, horário e local">
          <li>
            <IconeCalendario className="eventoFatoIcone" />
            <div>
              <span className="eventoFatoRotulo">Data</span>
              <strong>
                <time dateTime={evento.dataISO}>{evento.dataExtenso}</time>
              </strong>
            </div>
          </li>
          <li>
            <IconeRelogio className="eventoFatoIcone" />
            <div>
              <span className="eventoFatoRotulo">Horário</span>
              <strong>{evento.horario}</strong>
            </div>
          </li>
          <li>
            <IconePino className="eventoFatoIcone" />
            <div>
              <span className="eventoFatoRotulo">Local</span>
              <strong>{evento.local}</strong>
              <span className="eventoFatoDetalhe">{evento.endereco}</span>
            </div>
          </li>
        </ul>

        <div className="eventoCorpo">
          <div className="eventoPrincipal">
            <section className="eventoSecao" aria-labelledby="evento-sobre">
              <h2 id="evento-sobre">Sobre o evento</h2>
              {evento.descricaoCompleta.map((paragrafo) => (
                <p key={paragrafo}>{paragrafo}</p>
              ))}
            </section>

            <section className="eventoSecao" aria-labelledby="evento-programacao">
              <h2 id="evento-programacao">Programação</h2>
              <ol className="eventoProgramacao">
                {evento.programacao.map((item) => (
                  <li key={item.hora}>
                    <span className="eventoHora">{item.hora}</span>
                    <div>
                      <strong>{item.titulo}</strong>
                      <p>{item.detalhe}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <aside className="eventoLateral">
            <section className="eventoSecao eventoCartao" aria-labelledby="evento-infos">
              <h2 id="evento-infos">Informações adicionais</h2>
              <ul className="eventoInfos">
                {evento.informacoes.map((info) => (
                  <li key={info}>{info}</li>
                ))}
              </ul>
            </section>

            <section className="eventoSecao eventoCartao" aria-labelledby="evento-organizacao">
              <h2 id="evento-organizacao">Organização</h2>
              <p className="eventoOrganizacaoNome">{evento.organizacao.nome}</p>
              <p>{evento.organizacao.descricao}</p>
            </section>
          </aside>
        </div>

        <Link to="/quem-usa" className="eventoVoltar eventoVoltarFim">
          <span aria-hidden="true">←</span> Voltar para Quem Usa
        </Link>
      </main>
    </div>
  );
}
