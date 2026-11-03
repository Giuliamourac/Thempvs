import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import logo from '../assets/Logo1.png';
import iconeCarrinho from '../assets/iconCart.png';

const LINKS = [
  { to: '/', rotulo: 'Home', end: true },
  { to: '/produtos', rotulo: 'Produtos' },
  { to: '/sale', rotulo: 'Sale' },
  { to: '/lojas', rotulo: 'Lojas' },
  { to: '/contato', rotulo: 'Contato' },
  { to: '/movement', rotulo: 'Movement' },
  { to: '/quem-usa', rotulo: 'Quem Usa' },
];

function CampoBusca() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params, setParams] = useSearchParams();
  const [textoLocal, setTextoLocal] = useState('');

  const naListagem = pathname === '/produtos';
  const valor = naListagem ? (params.get('q') ?? '') : textoLocal;

  const aoDigitar = (evento) => {
    const novo = evento.target.value;
    if (!naListagem) return setTextoLocal(novo);

    setParams(
      (atual) => {
        const proximo = new URLSearchParams(atual);
        if (novo) proximo.set('q', novo);
        else proximo.delete('q');
        return proximo;
      },
      { replace: true },
    );
  };

  const aoEnviar = (evento) => {
    evento.preventDefault();
    if (naListagem) return;
    const termo = textoLocal.trim();
    navigate(termo ? `/produtos?q=${encodeURIComponent(termo)}` : '/produtos');
    setTextoLocal('');
  };

  return (
    <form role="search" onSubmit={aoEnviar}>
      <input
        type="text"
        value={valor}
        onChange={aoDigitar}
        placeholder="Digite o que você procura!"
        aria-label="Buscar produtos"
      />
    </form>
  );
}

export default function Header() {
  const { totais } = useCart();
  const { usuario } = useAuth();
  const quantidade = totais.quantidadeItens;
  const inicial = usuario?.nome?.trim().charAt(0).toUpperCase() || '?';

  return (
    <header>
      <div>
        FRETE GRATIS ACIMA DE: R$ 199,90 &nbsp;|&nbsp; CUPOM PARA PRIMEIRA COMPRA: PRIMEIRA20
        &nbsp;|&nbsp;
      </div>

      <nav>
        <Link to="/" className="header-logo" aria-label="Thempvs — página inicial">
          <img src={logo} alt="Logo" />
        </Link>

        <ul>
          {LINKS.map(({ to, rotulo, end }) => (
            <li key={to}>
              <NavLink to={to} end={end}>
                {rotulo}
              </NavLink>
            </li>
          ))}
        </ul>

        <div>
          <CampoBusca />

          <Link
            to="/carrinho"
            id="carrinho"
            aria-label={quantidade > 0 ? `Carrinho (${quantidade} itens)` : 'Carrinho'}
          >
            <img src={iconeCarrinho} alt="" />
            {quantidade > 0 && (
              <span className="cart-badge" aria-hidden="true">
                {quantidade}
              </span>
            )}
          </Link>

          <Link to="/perfil" aria-label={usuario ? `Minha conta (${usuario.nome})` : 'Entrar'}>
            <img
              id="avatarNavbar"
              src={`https://placehold.co/55x55/0d1525/4a5e80?text=${encodeURIComponent(inicial)}`}
              alt=""
            />
          </Link>
        </div>
      </nav>
    </header>
  );
}
