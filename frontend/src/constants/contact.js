/**
 * Dados de contato e redes sociais da marca (usados em Contato e na Home).
 * Telefones/e-mails vêm do design da página Contato. ATENÇÃO: os links das redes sociais
 * abaixo foram montados a partir do @Thempvs do design — confirme se são os perfis oficiais.
 */
export const REDES_SOCIAIS = [
  { id: 'instagram', rotulo: 'Instagram', usuario: '@Thempvs', url: 'https://www.instagram.com/thempvs' },
  { id: 'facebook', rotulo: 'Facebook', usuario: '@Thempvs', url: 'https://www.facebook.com/thempvs' },
  { id: 'tiktok', rotulo: 'TikTok', usuario: '@Thempvs', url: 'https://www.tiktok.com/@thempvs' },
];

export const CONTATOS = {
  sac: { telefone: '13 986573486', email: 'sac_thempvs@gmail.com' },
  entrega: {
    telefone: '13 963428745',
    email: 'entregasthempvs@gmail.com',
    whatsapp: '13 998431578',
  },
};

/** "13 986573486" → "+5513986573486" (para tel: e wa.me). */
export const telefoneInternacional = (texto) => `+55${String(texto).replace(/\D/g, '')}`;
