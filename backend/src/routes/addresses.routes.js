import { Router } from 'express';
import * as controller from '../controllers/addresses.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, validateId } from '../middleware/validate.js';
import { addressSchema } from '../validators/address.schema.js';

const router = Router();

router.use(requireAuth); // endereços são sempre do usuário logado

router.get('/', controller.list);
router.post('/', validateBody(addressSchema), controller.create);
router.delete('/:id', validateId, controller.remove);

export default router;
