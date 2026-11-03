/** Textos e regras de exibição dos pedidos (o servidor é quem decide o que é permitido). */

export const STATUS_PEDIDO = ['Pendente', 'Pago', 'Enviado', 'Entregue', 'Cancelado'];

export const ROTULO_STATUS = {
  Pendente: 'Aguardando pagamento',
  Pago: 'Pago',
  Enviado: 'Enviado',
  Entregue: 'Entregue',
  Cancelado: 'Cancelado',
};

export const ROTULO_PAGAMENTO = {
  pendente: 'Aguardando confirmação',
  aprovado: 'Aprovado',
  recusado: 'Não aprovado',
  estornado: 'Estornado',
};

export const NOMES_METODOS = { pix: 'Pix', boleto: 'Boleto', credito: 'Cartão de crédito', debito: 'Cartão de débito' };

/** Próximos status possíveis a partir do atual (espelha o fluxo do backend). */
export const PROXIMOS_STATUS = {
  Pendente: ['Pago', 'Cancelado'],
  Pago: ['Enviado', 'Cancelado'],
  Enviado: ['Entregue'],
  Entregue: [],
  Cancelado: [],
};

/** Só caminhos internos ("/pedidos/3"): evita redirecionar para outro site via ?next=. */
export const destinoSeguro = (valor, padrao = '/') =>
  typeof valor === 'string' && /^\/(?![/\\])/.test(valor) ? valor : padrao;
