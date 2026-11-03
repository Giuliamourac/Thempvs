import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RequireAuth({ admin = false, children }) {
  const { usuario, status, ehAdmin } = useAuth();
  const { pathname, search } = useLocation();

  if (status === 'carregando') return <p className="estado-pagina">Carregando...</p>;

  if (!usuario) {
    return <Navigate to={`/entrar?next=${encodeURIComponent(pathname + search)}`} replace />;
  }

  if (admin && !ehAdmin) {
    return (
      <main className="estado-pagina">
        <h1>Acesso restrito</h1>
        <p>Esta área é exclusiva para administradores da loja.</p>
        <p>
          <Link to="/">Voltar para a loja</Link>
        </p>
      </main>
    );
  }

  return children;
}
