/** Opções da sidebar: as que existem (com quantidade) + as marcadas na URL que não existem mais. */
export const opcoesDe = (itens = [], selecionados, valorDe = (i) => i.nome) => {
  const opcoes = itens.map((item) => ({ valor: valorDe(item), rotulo: `${item.nome} (${item.total})` }));
  for (const marcado of selecionados) {
    if (!opcoes.some((o) => o.valor === marcado)) opcoes.push({ valor: marcado, rotulo: marcado });
  }
  return opcoes;
};

/** Liga/desliga um valor de um filtro multi-valor na URL (?cor=Preto&cor=Branco). */
export const alternarNaUrl = (setParams, nome, valor) =>
  setParams(
    (atual) => {
      const proximo = new URLSearchParams(atual);
      const lista = proximo.getAll(nome);
      proximo.delete(nome);
      const nova = lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];
      nova.forEach((item) => proximo.append(nome, item));
      return proximo;
    },
    { replace: true },
  );

/** Produto em promoção = tem preço promocional menor que o preço normal (mesma regra do componente Preco). */
export const emPromocao = (produto) =>
  produto.preco_promocional !== null && produto.preco_promocional < produto.preco;

/** Texto mostrado no cartão quando a peça tem várias cores ("3 cores"); com uma cor só não mostra nada. */
export const corNoCartao = (produto) => (produto.cores?.length > 1 ? `${produto.cores.length} cores` : null);

/** Fotos de roupa em pé (catálogo Movement, em /images/products): mostradas inteiras, sem cortar. */
export const fotoEmRetrato = (produto) => String(produto.imagem_url ?? '').startsWith('/images/products/');

/** Cor aberta por padrão na página do produto: a primeira que tem estoque (senão a primeira). */
export const corInicial = (produto) => {
  const variacoes = produto.variacoes ?? [];
  return produto.cores.find((cor) => variacoes.some((v) => v.cor === cor && v.estoque > 0)) ?? produto.cores[0] ?? '';
};

/**
 * Fotos a mostrar para a cor escolhida: a galeria da cor; sem foto própria, as fotos gerais do produto
 * (é o caso dos produtos antigos, que só têm galeria geral).
 */
export const imagensDaCor = (produto, cor) => {
  const daCor = produto.imagens_por_cor?.[cor] ?? [];
  if (daCor.length) return daCor;
  return produto.imagens?.length ? produto.imagens : [produto.imagem_url].filter(Boolean);
};
