import { useCart } from '../context/CartContext.jsx';
import Checkout from '../components/checkout/Checkout.jsx';

export default function Cart() {
  return (
    <div className="pagina-checkout">
      <section className="banner-checkout">
        <img src="https://placehold.co/1440x130/484848/ffffff?text=Banner+Thempvs" alt="" />
      </section>

      <Checkout cart={useCart()} />
    </div>
  );
}
