import { rateLimit } from 'express-rate-limit';

const limitar = ({ minutos, limite, mensagem, ...resto }) =>
  rateLimit({
    windowMs: minutos * 60 * 1000,
    limit: limite,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, res) => res.status(429).json({ error: mensagem }),
    ...resto,
  });

/** Só tentativas que FALHAM contam: 10 erros de senha por IP a cada 15 minutos. */
export const loginLimiter = limitar({
  minutos: 15,
  limite: 10,
  skipSuccessfulRequests: true,
  mensagem: 'Muitas tentativas de login. Aguarde alguns minutos e tente de novo.',
});

export const registerLimiter = limitar({
  minutos: 60,
  limite: 20,
  mensagem: 'Muitos cadastros a partir deste endereço. Tente novamente mais tarde.',
});
