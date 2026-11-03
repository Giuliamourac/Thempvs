import { createContext, useContext } from 'react';
import { CHAVE_CARRINHO, useCartStore } from '../hooks/useCartStore.js';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const cart = useCartStore(CHAVE_CARRINHO);
  return <CartContext.Provider value={cart}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart precisa estar dentro de <CartProvider>.');
  return context;
}
