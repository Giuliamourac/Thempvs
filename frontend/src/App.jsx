import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import Account from './pages/Account.jsx';
import AdminOrders from './pages/AdminOrders.jsx';
import AdminProducts from './pages/AdminProducts.jsx';
import Cart from './pages/Cart.jsx';
import ComingSoon from './pages/ComingSoon.jsx';
import Contact from './pages/Contact.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Movement from './pages/Movement.jsx';
import NotFound from './pages/NotFound.jsx';
import OrderDetail from './pages/OrderDetail.jsx';
import Orders from './pages/Orders.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Products from './pages/Products.jsx';
import Register from './pages/Register.jsx';
import Sale from './pages/Sale.jsx';
import WhoWears from './pages/WhoWears.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="produtos" element={<Products />} />
        <Route path="produtos/:ref" element={<ProductDetail />} />
        <Route path="carrinho" element={<Cart />} />
        <Route path="quem-usa" element={<WhoWears />} />

        <Route path="entrar" element={<Login />} />
        <Route path="cadastrar" element={<Register />} />
        <Route path="perfil" element={<RequireAuth><Account /></RequireAuth>} />
        <Route path="pedidos" element={<RequireAuth><Orders /></RequireAuth>} />
        <Route path="pedidos/:id" element={<RequireAuth><OrderDetail /></RequireAuth>} />

        <Route path="admin/produtos" element={<RequireAuth admin><AdminProducts /></RequireAuth>} />
        <Route path="admin/pedidos" element={<RequireAuth admin><AdminOrders /></RequireAuth>} />

        <Route path="sale" element={<Sale />} />
        <Route path="contato" element={<Contact />} />
        <Route path="movement" element={<Movement />} />

        {/* Ainda vazia no projeto original */}
        <Route path="lojas" element={<ComingSoon titulo="Lojas" />} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
