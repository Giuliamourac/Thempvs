import * as Product from '../models/product.model.js';
import { HttpError } from '../utils/httpError.js';
import { refSchema } from '../validators/product.schema.js';

const notFound = () => new HttpError(404, 'Produto não encontrado.');

// Express 5 encaminha erros de handlers async para o errorHandler automaticamente.

export async function list(req, res) {
  res.json(await Product.list(req.query));
}

export async function facets(_req, res) {
  res.json(await Product.facets());
}

export async function getByRef(req, res) {
  const ref = refSchema.safeParse(req.params.ref);
  if (!ref.success) throw notFound();
  const product = await Product.findByRef(ref.data);
  if (!product) throw notFound();
  res.json(product);
}

export async function create(req, res) {
  const product = await Product.create(req.body);
  res.status(201).location(`/api/products/${product.slug}`).json(product);
}

export async function update(req, res) {
  const product = await Product.update(req.productId, req.body);
  if (!product) throw notFound();
  res.json(product);
}

export async function remove(req, res) {
  const removed = await Product.remove(req.productId);
  if (!removed) throw notFound();
  res.status(204).end();
}
