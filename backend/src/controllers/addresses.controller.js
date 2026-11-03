import * as Address from '../models/address.model.js';
import { HttpError } from '../utils/httpError.js';

export async function list(req, res) {
  res.json(await Address.listByUser(req.user.id));
}

export async function create(req, res) {
  res.status(201).json(await Address.create(req.user.id, req.body));
}

export async function remove(req, res) {
  if (!(await Address.remove(req.user.id, req.id))) throw new HttpError(404, 'Endereço não encontrado.');
  res.status(204).end();
}
