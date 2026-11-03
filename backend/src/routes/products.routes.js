import { Router } from 'express';
import * as controller from '../controllers/products.controller.js';
import { requireAdmin } from '../middleware/auth.js';
import { validateBody, validateId, validateQuery } from '../middleware/validate.js';
import { listProductsQuery, productSchema } from '../validators/product.schema.js';

const router = Router();

// Leitura é pública (a vitrine); criar, editar e excluir exigem um administrador.
router.get('/', validateQuery(listProductsQuery), controller.list);
router.get('/filtros', controller.facets); // antes de /:ref, senão "filtros" viraria um slug
router.get('/:ref', controller.getByRef); // id numérico (links antigos) ou slug
router.post('/', requireAdmin, validateBody(productSchema), controller.create);
router.put('/:id', requireAdmin, validateId, validateBody(productSchema), controller.update);
router.delete('/:id', requireAdmin, validateId, controller.remove);

export default router;
