import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CatalogProvider } from './context/CatalogContext.jsx';
import { CartProvider } from './context/CartContext.jsx';

// A ordem importa: base primeiro; os demais são escopados por página (.page-*).
import './styles/base.css';
import './styles/home.css';
import './styles/products.css';
import './styles/product-detail.css';
import './styles/checkout.css';
import './styles/who-wears.css';
import './styles/admin.css';
import './styles/account.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter useTransitions={false}>
      <AuthProvider>
        <CatalogProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </CatalogProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
