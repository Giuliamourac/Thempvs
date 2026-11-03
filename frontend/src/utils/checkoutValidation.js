import { somenteDigitos } from './format.js';

/** Etapa a que cada campo pertence (editar um campo invalida a conclusão da etapa). */
export const ETAPA_DO_CAMPO = {
  enderecoId: 'endereco',
  cep: 'endereco',
  destinatario: 'endereco',
  rua: 'endereco',
  numero: 'endereco',
  complemento: 'endereco',
  bairro: 'endereco',
  cidade: 'endereco',
  estado: 'endereco',
  frete: 'pagamento',
  metodo: 'pagamento',
};

/** id do elemento a focar quando o campo é inválido. */
export const ID_DO_CAMPO = {
  enderecoId: 'enderecoSalvo-novo',
  cep: 'campoCep',
  destinatario: 'campoDestinatario',
  rua: 'campoRua',
  numero: 'campoNumero',
  bairro: 'campoBairro',
  cidade: 'campoCidade',
  estado: 'campoEstado',
  frete: 'frete-padrao',
  metodo: 'metodoPix',
};

/** Nome do campo no backend → nome do campo no formulário (só o que muda). */
export const CAMPO_DO_BACKEND = { uf: 'estado' };

// Cada validador devolve { campo: 'mensagem' } na ordem em que os campos aparecem na tela.

/** Endereço salvo escolhido = nada a validar; "novo" = valida o formulário. */
export function validarEndereco(form) {
  if (!form.enderecoId) return { enderecoId: 'Escolha um endereço de entrega.' };
  if (form.enderecoId !== 'novo') return {};

  const erros = {};
  const cep = somenteDigitos(form.cep);
  const destinatario = form.destinatario.trim();

  if (!cep) erros.cep = 'Informe o CEP.';
  else if (cep.length !== 8) erros.cep = 'O CEP deve ter 8 números.';

  if (!destinatario) erros.destinatario = 'Informe o nome do destinatário.';
  else if (destinatario.length < 3) erros.destinatario = 'Digite o nome completo.';

  if (!form.rua.trim()) erros.rua = 'Informe a rua ou logradouro.';
  if (!form.numero.trim()) erros.numero = 'Informe o número (ou S/N).';
  if (!form.bairro.trim()) erros.bairro = 'Informe o bairro.';
  if (!form.cidade.trim()) erros.cidade = 'Informe a cidade.';
  if (!form.estado) erros.estado = 'Selecione o estado.';

  return erros;
}

export function validarPagamento(form) {
  const erros = {};
  if (!form.frete) erros.frete = 'Escolha a forma de entrega.';
  if (!form.metodo) erros.metodo = 'Escolha uma forma de pagamento.';
  return erros;
}

export const VALIDADORES = {
  endereco: validarEndereco,
  pagamento: validarPagamento,
};

/** Máscaras aplicadas enquanto o usuário digita. */
export const MASCARAS = {
  cep: (valor) => {
    const d = somenteDigitos(valor).slice(0, 8);
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
  },
};
