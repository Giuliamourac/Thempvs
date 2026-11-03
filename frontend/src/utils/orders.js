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

export const PROXIMOS_STATUS = {
  Pendente: ['Pago', 'Cancelado'],
  Pago: ['Enviado', 'Cancelado'],
  Enviado: ['Entregue'],
  Entregue: [],
  Cancelado: [],
};

export const destinoSeguro = (valor, padrao = '/') =>
  typeof valor === 'string' && /^\/(?![/\\])/.test(valor) ? valor : padrao;
