import { useCallback, useEffect, useMemo, useState } from 'react';

export const CHAVE_CARRINHO = 'thempvs_carrinho';

export const QUANTIDADE_MINIMA = 1;
export const QUANTIDADE_MAXIMA = 99;

const texto = (valor) => String(valor ?? '').trim();

/** Maior quantidade permitida para o item: o estoque conhecido (se houver) ou 99. */
export const limiteDoItem = (item) =>
  Number.isInteger(item?.estoque) && item.estoque >= 1 ? Math.min(QUANTIDADE_MAXIMA, item.estoque) : QUANTIDADE_MAXIMA;

const limitarQuantidade = (quantidade, maximo = QUANTIDADE_MAXIMA) => {
  const numero = Math.floor(Number(quantidade));
  if (!Number.isFinite(numero)) return QUANTIDADE_MINIMA;
  return Math.min(maximo, Math.max(QUANTIDADE_MINIMA, numero));
};

/**
 * Valida e normaliza um item vindo da tela ou do localStorage. Retorna null se inválido.
 * `variacaoId` é o id da variação (produto + tamanho + cor) no banco: é ele que a API usa no pedido.
 * Preço, cor, tamanho e estoque aqui são só para EXIBIR; o servidor recalcula tudo no pedido.
 */
function sanearItem(bruto) {
  if (!bruto || typeof bruto !== 'object') return null;

  const variacaoId = Number(bruto.variacaoId);
  const produtoId = texto(bruto.produtoId);
  const nome = texto(bruto.nome);
  const preco = Math.round(Number(bruto.precoCentavos));
  if (!Number.isInteger(variacaoId) || variacaoId < 1) return null; // carrinhos antigos (sem id) são descartados
  if (!produtoId || !nome || !Number.isFinite(preco) || preco < 0) return null;

  const estoque = Number.isInteger(bruto.estoque) && bruto.estoque >= 0 ? bruto.estoque : null;
  const item = {
    variacaoId,
    produtoId,
    nome,
    precoCentavos: preco,
    cor: texto(bruto.cor),
    tamanho: texto(bruto.tamanho),
    imagem: texto(bruto.imagem),
    estoque,
  };
  return { ...item, quantidade: limitarQuantidade(bruto.quantidade, limiteDoItem(item)) };
}

function lerStorage(chave) {
  try {
    const lista = JSON.parse(window.localStorage.getItem(chave) ?? '[]');
    return Array.isArray(lista) ? lista.map(sanearItem).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function gravarStorage(chave, itens) {
  try {
    window.localStorage.setItem(chave, JSON.stringify(itens));
  } catch {
    // localStorage indisponível (modo privado, cota cheia): o carrinho segue só em memória.
  }
}

/**
 * Estado do carrinho persistido em localStorage.
 * Itens da mesma variação (produto + tamanho + cor) são somados em uma única linha.
 */
export function useCartStore(chave = CHAVE_CARRINHO) {
  const [itens, setItens] = useState(() => lerStorage(chave));

  useEffect(() => {
    gravarStorage(chave, itens);
  }, [chave, itens]);

  // Mantém várias abas sincronizadas.
  useEffect(() => {
    const aoMudarStorage = (evento) => {
      if (evento.key === chave) setItens(lerStorage(chave));
    };
    window.addEventListener('storage', aoMudarStorage);
    return () => window.removeEventListener('storage', aoMudarStorage);
  }, [chave]);

  /**
   * Retorna { ok, limitado }:
   *   ok=false      → dados inválidos;
   *   limitado=true → já havia todo o estoque no carrinho (ou a soma passou dele e foi cortada).
   */
  const adicionar = useCallback(
    (dados) => {
      const novo = sanearItem(dados);
      if (!novo) return { ok: false, limitado: false };

      const existente = itens.find((item) => item.variacaoId === novo.variacaoId);
      const limite = limiteDoItem(novo);
      const pedida = (existente?.quantidade ?? 0) + novo.quantidade;
      const limitado = pedida > limite;

      setItens((atuais) => {
        const indice = atuais.findIndex((item) => item.variacaoId === novo.variacaoId);
        const quantidade = limitarQuantidade(pedida, limite);
        if (indice < 0) return [...atuais, { ...novo, quantidade }];

        const copia = [...atuais];
        copia[indice] = { ...copia[indice], estoque: novo.estoque, quantidade };
        return copia;
      });
      return { ok: true, limitado };
    },
    [itens],
  );

  const alterarQuantidade = useCallback((variacaoId, delta) => {
    setItens((atuais) =>
      atuais.map((item) =>
        item.variacaoId === variacaoId
          ? { ...item, quantidade: limitarQuantidade(item.quantidade + delta, limiteDoItem(item)) }
          : item,
      ),
    );
  }, []);

  const remover = useCallback((variacaoId) => {
    setItens((atuais) => atuais.filter((item) => item.variacaoId !== variacaoId));
  }, []);

  const limpar = useCallback(() => setItens([]), []);

  /**
   * Alinha o carrinho com a cotação do servidor (`quote.itens`): atualiza estoque e preço,
   * tira o que não está mais à venda/esgotou e reduz quantidades acima do estoque.
   */
  const ajustarAoServidor = useCallback((itensDaCotacao) => {
    const porId = new Map(itensDaCotacao.map((linha) => [linha.variacao_id, linha]));
    setItens((atuais) =>
      atuais.flatMap((item) => {
        const linha = porId.get(item.variacaoId);
        if (!linha || linha.estoque === undefined || linha.estoque === 0) return [];
        const atualizado = { ...item, estoque: linha.estoque, precoCentavos: Math.round(linha.preco_unitario * 100) };
        return [{ ...atualizado, quantidade: limitarQuantidade(item.quantidade, limiteDoItem(atualizado)) }];
      }),
    );
  }, []);

  const itensComSubtotal = useMemo(
    () => itens.map((item) => ({ ...item, subtotalCentavos: item.precoCentavos * item.quantidade })),
    [itens],
  );

  const totais = useMemo(() => {
    const subtotalCentavos = itens.reduce((soma, item) => soma + item.precoCentavos * item.quantidade, 0);
    return {
      quantidadeItens: itens.reduce((soma, item) => soma + item.quantidade, 0),
      subtotalCentavos,
    };
  }, [itens]);

  return { itens: itensComSubtotal, totais, adicionar, alterarQuantidade, remover, limpar, ajustarAoServidor };
}
