import bcrypt from 'bcryptjs';
import { signToken } from '../middleware/auth.js';
import * as User from '../models/user.model.js';
import { HttpError } from '../utils/httpError.js';

export const BCRYPT_COST = 12;

// Hash de mentira: quando o email não existe, ainda gastamos o mesmo tempo de um login real,
// para que o tempo de resposta não revele quais emails estão cadastrados.
const HASH_FALSO = bcrypt.hashSync('senha-que-nunca-sera-usada', BCRYPT_COST);

const resposta = (user) => ({ token: signToken(user), usuario: user });

export async function register(req, res) {
  const { nome, email, senha, telefone } = req.body;
  const senhaHash = await bcrypt.hash(senha, BCRYPT_COST);
  const user = await User.createCustomer({ nome, email, senhaHash, telefone });
  res.status(201).json(resposta(user));
}

export async function login(req, res) {
  const { email, senha } = req.body;
  const linha = await User.findForLogin(email);

  const senhaConfere = await bcrypt.compare(senha, linha?.senha_hash ?? HASH_FALSO);
  if (!linha || !linha.ativo || !senhaConfere) {
    throw new HttpError(401, 'Email ou senha incorretos.');
  }
  res.json(resposta(User.toPublicUser(linha)));
}

export function me(req, res) {
  res.json({ usuario: req.user });
}
