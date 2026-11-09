import bannerProdutos from '../assets/banners/produtos.jpg';
import ScopedProductsPage from '../components/ScopedProductsPage.jsx';
import { emPromocao } from '../utils/listing.js';

const BANNER = { src: bannerProdutos, alt: 'Sale' };
const PARAMS = {}; // todos os produtos; quem fica é decidido por `emPromocao`

/** Sale não é uma categoria: reúne os produtos que têm preco_promocional menor que o preço normal. */
export default function Sale() {
  return (
    <ScopedProductsPage
      titulo="Sale"
      banner={BANNER}
      params={PARAMS}
      manter={emPromocao}
      mensagemVazia="Nenhum produto em promoção no momento."
    />
  );
}
