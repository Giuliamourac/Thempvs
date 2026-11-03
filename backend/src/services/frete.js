/**
 * Cálculo de frete — TABELA FIXA por região e peso.
 *
 * É um substituto simples para uma integração real (Correios, Melhor Envio, Frenet...):
 * quando você contratar uma, troque só a função `cotarFrete` — o resto do sistema
 * (cotação na tela, criação do pedido) já passa por ela e SEMPRE recalcula no servidor.
 * Valores em centavos.
 */
import { env } from '../config/env.js';

const REGIAO_POR_UF = {
  SP: 'sudeste', RJ: 'sudeste', MG: 'sudeste', ES: 'sudeste',
  PR: 'sul', SC: 'sul', RS: 'sul',
  DF: 'centro-oeste', GO: 'centro-oeste', MT: 'centro-oeste', MS: 'centro-oeste',
  AL: 'nordeste', BA: 'nordeste', CE: 'nordeste', MA: 'nordeste', PB: 'nordeste',
  PE: 'nordeste', PI: 'nordeste', RN: 'nordeste', SE: 'nordeste',
  AC: 'norte', AP: 'norte', AM: 'norte', PA: 'norte', RO: 'norte', RR: 'norte', TO: 'norte',
};

// base = primeiro kg · porKg = cada kg adicional · prazo = dias corridos (serviço padrão)
const TABELA = {
  sudeste: { base: 1990, porKg: 400, prazo: 4 },
  sul: { base: 2490, porKg: 500, prazo: 5 },
  'centro-oeste': { base: 2990, porKg: 600, prazo: 6 },
  nordeste: { base: 3490, porKg: 700, prazo: 8 },
  norte: { base: 3990, porKg: 800, prazo: 10 },
};

export const SERVICOS = ['padrao', 'expresso'];

/**
 * @returns {{ servico: string, nome: string, valor_centavos: number, prazo_dias: number, gratis: boolean }[]}
 */
export function cotarFrete({ uf, pesoGramas, subtotalCentavos }) {
  const regiao = TABELA[REGIAO_POR_UF[uf]];
  if (!regiao) return [];

  const kgAdicionais = Math.max(0, Math.ceil(pesoGramas / 1000) - 1);
  const padrao = regiao.base + kgAdicionais * regiao.porKg;
  const gratis = subtotalCentavos >= Math.round(env.freteGratisAPartirDe * 100);

  return [
    { servico: 'padrao', nome: 'Padrão', valor_centavos: gratis ? 0 : padrao, prazo_dias: regiao.prazo, gratis },
    {
      servico: 'expresso',
      nome: 'Expresso',
      valor_centavos: Math.round((padrao * 1.8) / 10) * 10, // o frete grátis vale só para o padrão
      prazo_dias: Math.max(1, Math.ceil(regiao.prazo / 2)),
      gratis: false,
    },
  ];
}
