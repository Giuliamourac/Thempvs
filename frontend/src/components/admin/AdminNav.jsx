import { NavLink } from 'react-router-dom';

export default function AdminNav() {
  return (
    <nav className="admin-nav" aria-label="Administração">
      <NavLink to="/admin/produtos">Produtos</NavLink>
      <NavLink to="/admin/pedidos">Pedidos</NavLink>
    </nav>
  );
}
