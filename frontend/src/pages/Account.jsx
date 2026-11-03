import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Account() {
  const { usuario, ehAdmin, sair } = useAuth();
  const navigate = useNavigate();

  const aoSair = () => {
    sair();
    navigate('/', { replace: true });
  };

  return (
    <main className="conta conta-estreita">
      <h1>Minha conta</h1>

      <dl className="conta-dados">
        <div>
          <dt>Nome</dt>
          <dd>{usuario.nome}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{usuario.email}</dd>
        </div>
        {usuario.telefone && (
          <div>
            <dt>Telefone</dt>
            <dd>{usuario.telefone}</dd>
          </div>
        )}
      </dl>

      <div className="conta-links">
        <Link to="/pedidos">Meus pedidos</Link>
        {ehAdmin && <Link to="/admin/produtos">Administrar produtos</Link>}
        {ehAdmin && <Link to="/admin/pedidos">Administrar pedidos</Link>}
      </div>

      <button type="button" className="conta-botao secundario" onClick={aoSair}>
        Sair
      </button>
    </main>
  );
}
