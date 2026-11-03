import { Router } from 'express';
import * as controller from '../controllers/catalog.controller.js';
import { requireAdmin } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { novoItemSchema } from '../validators/catalog.schema.js';

export const categoriaRoutes = Router();
categoriaRoutes.get('/', controller.categorias);
categoriaRoutes.post('/', requireAdmin, validateBody(novoItemSchema), controller.criarCategoria);

export const colecaoRoutes = Router();
colecaoRoutes.get('/', controller.colecoes);
colecaoRoutes.post('/', requireAdmin, validateBody(novoItemSchema), controller.criarColecao);
