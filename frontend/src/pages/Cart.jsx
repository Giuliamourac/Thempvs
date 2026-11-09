import bannerCarrinho from '../assets/banners/carrinho.jpg';
import { useCart } from '../context/CartContext.jsx';
import Checkout from '../components/checkout/Checkout.jsx';

export default function Cart() {
  return (
    <div className="pagina-checkout">
      <section className="banner-checkout">
        <img src={bannerCarrinho} alt="" />
      </section>

      <Checkout cart={useCart()} />
    </div>
  );
}
