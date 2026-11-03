import * as Catalog from '../models/catalog.model.js';

export const categorias = async (_req, res) => res.json(await Catalog.listarCategorias());
export const colecoes = async (_req, res) => res.json(await Catalog.listarColecoes());
export const criarCategoria = async (req, res) => res.status(201).json(await Catalog.criarCategoria(req.body.nome));
export const criarColecao = async (req, res) =>
  res.status(201).json(await Catalog.criarColecao(req.body.nome, req.body.descricao));
