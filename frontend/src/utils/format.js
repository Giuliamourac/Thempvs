const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const formatarMoeda = (valor) => moeda.format(Number(valor) || 0);

export const formatarCentavos = (centavos) => formatarMoeda((Number(centavos) || 0) / 100);

export const paraCentavos = (valor) => Math.round((Number(valor) || 0) * 100);

export const normalizar = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

export const somenteDigitos = (texto) => String(texto ?? '').replace(/\D/g, '');

export const formatarCep = (cep) => {
  const d = somenteDigitos(cep);
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : String(cep ?? '');
};

export const formatarData = (valor, { hora = false } = {}) => {
  if (!valor) return '—';
  const texto = String(valor);
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto.split('-').reverse().join('/');
  const data = new Date(texto);
  if (Number.isNaN(data.getTime())) return '—';
  return data.toLocaleString('pt-BR', hora ? { dateStyle: 'short', timeStyle: 'short' } : { dateStyle: 'short' });
};
