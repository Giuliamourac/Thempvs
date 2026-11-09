import banner from '../assets/banners/carrinho.jpg';
import { IconeEmail, IconeTelefone, IconeWhatsapp, ICONE_REDE } from '../components/Icons.jsx';
import { CONTATOS, REDES_SOCIAIS, telefoneInternacional } from '../constants/contact.js';

/** Um canal de contato: ícone grande + rótulo + valor, tudo clicável (tel:, mailto:, wa.me). */
function Canal({ icone: Icone, rotulo, valor, href, externo = false }) {
  return (
    <a className="contato-canal" href={href} {...(externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      <Icone className="contato-icone" />
      <span className="contato-rotulo">{rotulo}</span>
      <span className="contato-valor">{valor}</span>
    </a>
  );
}

/**
 * Página de Contato (conforme o design): redes sociais, SAC e problemas com a entrega.
 * O design não tem formulário, então não há envio de mensagem — e o backend também
 * não possui endpoint para isso. Todos os canais são links diretos.
 */
export default function Contact() {
  const { sac, entrega } = CONTATOS;

  return (
    <div className="page-contact">
      <main>
        <section className="contato-banner">
          <img src={banner} alt="" />
        </section>

        <div className="contato-conteudo">
          <section className="contato-secao" aria-labelledby="contato-redes">
            <h1 id="contato-redes">Nossas redes sociais</h1>
            <ul className="contato-lista">
              {REDES_SOCIAIS.map(({ id, rotulo, usuario, url }) => {
                const Icone = ICONE_REDE[id];
                return (
                  <li key={id}>
                    <a className="contato-canal" href={url} target="_blank" rel="noopener noreferrer" aria-label={`${rotulo} ${usuario}`}>
                      <Icone className="contato-icone" />
                      <span className="contato-valor">{usuario}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>

          <hr />

          <section className="contato-secao" aria-labelledby="contato-sac">
            <h2 id="contato-sac">Entre em contato conosco</h2>
            <ul className="contato-lista">
              <li>
                <Canal icone={IconeTelefone} rotulo="SAC - Telefone" valor={sac.telefone} href={`tel:${telefoneInternacional(sac.telefone)}`} />
              </li>
              <li>
                <Canal icone={IconeEmail} rotulo="SAC - E-mail" valor={sac.email} href={`mailto:${sac.email}`} />
              </li>
            </ul>
          </section>

          <hr />

          <section className="contato-secao" aria-labelledby="contato-entrega">
            <h2 id="contato-entrega">Problemas com a entrega?</h2>
            <ul className="contato-lista">
              <li>
                <Canal icone={IconeTelefone} rotulo="SAC - Telefone" valor={entrega.telefone} href={`tel:${telefoneInternacional(entrega.telefone)}`} />
              </li>
              <li>
                <Canal icone={IconeEmail} rotulo="SAC - E-mail" valor={entrega.email} href={`mailto:${entrega.email}`} />
              </li>
              <li>
                <Canal
                  icone={IconeWhatsapp}
                  rotulo="WhatsApp - Pedidos"
                  valor={entrega.whatsapp}
                  href={`https://wa.me/${telefoneInternacional(entrega.whatsapp).slice(1)}`}
                  externo
                />
              </li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
