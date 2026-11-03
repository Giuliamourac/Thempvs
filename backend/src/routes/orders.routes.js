import { Router } from 'express';
import * as controller from '../controllers/orders.controller.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { validateBody, validateId, validateQuery } from '../middleware/validate.js';
import { createOrderSchema, listOrdersQuery, quoteSchema, statusSchema } from '../validators/order.schema.js';

const router = Router();

router.post('/cotacao', validateBody(quoteSchema), controller.quote);

router.post('/', requireAuth, validateBody(createOrderSchema), controller.create);
router.get('/', requireAuth, validateQuery(listOrdersQuery), controller.list);
router.get('/:id', requireAuth, validateId, controller.getById);
router.post('/:id/cancelar', requireAuth, validateId, controller.cancel);
router.patch('/:id/status', requireAdmin, validateId, validateBody(statusSchema), controller.setStatus);

export default router;
