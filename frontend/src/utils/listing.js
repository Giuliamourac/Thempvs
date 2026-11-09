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
