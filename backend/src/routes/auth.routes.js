import { Router } from 'express';
import * as controller from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { loginLimiter, registerLimiter } from '../middleware/rateLimit.js';
import { validateBody } from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../validators/auth.schema.js';

const router = Router();

router.post('/register', registerLimiter, validateBody(registerSchema), controller.register);
router.post('/login', loginLimiter, validateBody(loginSchema), controller.login);
router.get('/me', requireAuth, controller.me);

export default router;
