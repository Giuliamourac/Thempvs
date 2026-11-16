import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import AvisoServidor from './AvisoServidor.jsx';

export default function Layout() {
  const { pathname } = useLocation();

  // Ao trocar de página, volta ao topo (comportamento que o navegador tinha nas páginas HTML).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <AvisoServidor />
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}
