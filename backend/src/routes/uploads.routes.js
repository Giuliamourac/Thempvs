import { Router } from 'express';
import multer from 'multer';
import * as controller from '../controllers/uploads.controller.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// Em memória (até 5 MB): o controller confere o conteúdo antes de gravar em disco.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

// requireAdmin vem ANTES do multer: sem login, o arquivo nem chega a ser lido.
router.post('/', requireAdmin, upload.single('imagem'), controller.uploadImage);

export default router;
