import { Router } from 'express';
import multer from 'multer';
import * as controller from '../controllers/uploads.controller.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

router.post('/', requireAdmin, upload.single('imagem'), controller.uploadImage);

export default router;
