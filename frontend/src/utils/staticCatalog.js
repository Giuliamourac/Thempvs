import { CATEGORIA_ESTATICA, PRODUTOS_ESTATICOS } from '../data/staticProducts.js';
import { normalizar } from './format.js';

/** Peça estática pelo endereço (/produtos/<slug>); undefined se o endereço não for de uma delas. */
export const buscarEstatico = (ref) => PRODUTOS_ESTATICOS.find((p) => p.slug === ref);

/** Outras cores da MESMA peça (ex.: Conjunto Ana em Branco, Preto e Cinza). */
export const outrasCores = (produto) =>
  PRODUTOS_ESTATICOS.filter((p) => p.nome === produto.nome && p.id !== produto.id);

const contem = (lista, selecionados) =>
  selecionados.length === 0 || selecionados.some((s) => lista.some((v) => normalizar(v) === normalizar(s)));

/**
 * Peças estáticas que passam nos MESMOS filtros da listagem (?categoria=&cor=&tamanho=&q=&colecao=&ordem=)
 * e na mesma ordem. Como elas não têm tamanho cadastrado, quem filtra por tamanho não as vê.
 */
export function filtrarEstaticos({ categoria = [], cor = [], tamanho = [], colecao = '', q = '', ordem = 'recentes' } = {}) {
  if (tamanho.length > 0) return [];

  const busca = normalizar(q);
  const lista = PRODUTOS_ESTATICOS.filter(
    (p) =>
      (categoria.length === 0 || categoria.includes(p.categoria)) &&
      contem(p.cores, cor) &&
      (!colecao || normalizar(p.colecao?.slug) === normalizar(colecao)) &&
      (!busca || normalizar(`${p.nome} ${p.descricao} ${p.cor}`).includes(busca)),
  );

  const porNome = (a, b) => a.nome.localeCompare(b.nome, 'pt-BR') || a.cor.localeCompare(b.cor, 'pt-BR');
  if (ordem === 'nome') return [...lista].sort(porNome);
  if (ordem === 'menor_preco') return [...lista].sort((a, b) => a.preco - b.preco || porNome(a, b));
  if (ordem === 'maior_preco') return [...lista].sort((a, b) => b.preco - a.preco || porNome(a, b));
  return lista;
}

/** Soma uma unidade ao item da lista (cria o item se não existir). */
const somar = (lista, acha, novo) => {
  const existente = lista.find(acha);
  if (existente) existente.total += 1;
  else lista.push({ ...novo, total: 1 });
};

/**
 * Junta as peças estáticas às opções da sidebar que vieram da API (GET /products/filtros).
 * Funciona também sem API (`facetas` nulo): a sidebar mostra só as peças estáticas.
 */
export function somarFacetas(facetas) {
  const base = facetas ?? {};
  const categorias = (base.categorias ?? []).map((c) => ({ ...c }));
  const cores = (base.cores ?? []).map((c) => ({ ...c }));

  for (const p of PRODUTOS_ESTATICOS) {
    somar(categorias, (c) => c.slug === p.categoria, { slug: CATEGORIA_ESTATICA.slug, nome: CATEGORIA_ESTATICA.nome });
    for (const cor of p.cores) somar(cores, (c) => normalizar(c.nome) === normalizar(cor), { nome: cor });
  }

  const porNome = (a, b) => a.nome.localeCompare(b.nome, 'pt-BR');
  return { ...base, categorias: categorias.sort(porNome), cores: cores.sort(porNome) };
}
