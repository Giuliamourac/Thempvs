import { Link } from 'react-router-dom';
import logo from '../assets/Logo1.png';

const LINKS_PRODUTOS = [
  ['Camiseta', 'camisetas'],
  ['Calça', 'calcas'],
  ['Boné', 'acessorios'],
  ['Casaco', 'casacos'],
  ['Jaquetas', 'casacos'],
  ['Bermudas', 'bermudas'],
];

const REDES = ['Instagram', 'Facebook', 'WhatsApp', 'Twitter'];

const MAPA_URL =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3645.718873730303!2d-46.3340!3d-23.9680!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjPCsDU4JzA0LjgiUyA0NsKwMjAnMDIuNCJX!5e0!3m2!1spt-PT!2spt!4v1600000000000';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-col logo-col">
          <div className="logo">
            <img src={logo} alt="Logo" />
          </div>
          <p className="tagline">Thempvs é dança</p>
        </div>

        <div className="footer-col">
          <h3>Produtos</h3>
          <ul>
            {LINKS_PRODUTOS.map(([rotulo, categoria]) => (
              <li key={rotulo}>
                <Link to={`/produtos?categoria=${categoria}`}>{rotulo}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-col">
          <h3>Redes</h3>
          <ul>
            {REDES.map((rede) => (
              <li key={rede}>
                <a href="#">{rede}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-col">
          <h3>Sac</h3>
          <p>
            <a href="mailto:sac_thempvs@gmail.com.br" className="email-link">
              sac_thempvs@gmail.com.br
            </a>
          </p>
          <p>(13) 97537-4873</p>
        </div>

        <div className="footer-col map-col">
          <iframe
            src={MAPA_URL}
            title="Localização da Thempvs"
            width="100%"
            height="120"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
          />
        </div>
      </div>
    </footer>
  );
}
