import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import * as User from '../models/user.model.js';
import { HttpError } from '../utils/httpError.js';

export function signToken(user) {
  if (!env.jwtSecret) throw new Error('JWT_SECRET não configurado.');
  return jwt.sign({ perfil: user.perfil }, env.jwtSecret, {
    subject: String(user.id),
    expiresIn: env.jwtExpiresIn,
    algorithm: 'HS256',
  });
}

/**
 * Exige "Authorization: Bearer <token>". O usuário é relido do banco a cada requisição:
 * assim, uma conta desativada (ou um admin rebaixado) perde o acesso na hora,
 * sem esperar o token expirar.
 */
export async function requireAuth(req, _res, next) {
  const [esquema, token] = (req.get('authorization') ?? '').split(' ');
  if (esquema?.toLowerCase() !== 'bearer' || !token) {
    throw new HttpError(401, 'Faça login para continuar.');
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
  } catch {
    throw new HttpError(401, 'Sua sessão expirou. Entre novamente.');
  }

  const user = await User.findActiveById(Number(payload.sub));
  if (!user) throw new HttpError(401, 'Sua sessão expirou. Entre novamente.');

  req.user = user;
  next();
}

const exigirAdmin = (req, _res, next) => {
  if (req.user?.perfil !== 'admin') throw new HttpError(403, 'Acesso restrito a administradores.');
  next();
};

/** Use como middleware de rota: já inclui o login. */
export const requireAdmin = [requireAuth, exigirAdmin];
