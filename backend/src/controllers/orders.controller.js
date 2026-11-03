import * as Order from '../models/order.model.js';
import { pool } from '../config/db.js';
import { HttpError } from '../utils/httpError.js';

const naoEncontrado = () => new HttpError(404, 'Pedido não encontrado.');

export async function quote(req, res) {
  res.json(await Order.quote(req.body));
}

export async function create(req, res) {
  const pedido = await Order.create(req.user.id, req.body);
  res.status(201).location(`/api/pedidos/${pedido.id}`).json(pedido);
}

export async function list(req, res) {
  const { todos, status, pagina, limite } = req.query;
  if (todos && req.user.perfil !== 'admin') throw new HttpError(403, 'Acesso restrito a administradores.');
  res.json(await Order.list({ userId: todos ? null : req.user.id, status, pagina, limite }));
}

export async function getById(req, res) {
  const pedido = await Order.findById(pool, req.id);
  if (!pedido || (req.user.perfil !== 'admin' && pedido.usuario_id !== req.user.id)) throw naoEncontrado();
  res.json(pedido);
}

export async function cancel(req, res) {
  const pedido = await Order.changeStatus(req.id, 'Cancelado', { donoId: req.user.id });
  if (!pedido) throw naoEncontrado();
  res.json(pedido);
}

export async function setStatus(req, res) {
  const pedido = await Order.changeStatus(req.id, req.body.status, { transportadora: req.body.transportadora });
  if (!pedido) throw naoEncontrado();
  res.json(pedido);
}
