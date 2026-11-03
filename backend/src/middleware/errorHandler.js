import { HttpError } from '../utils/httpError.js';

const DB_UNAVAILABLE = new Set(['ECONNREFUSED', 'ETIMEDOUT', 'PROTOCOL_CONNECTION_LOST', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR']);

export function notFound(req, res) {
  res.status(404).json({ error: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, ...(err.details && { details: err.details }) });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido no corpo da requisição.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Corpo da requisição grande demais.' });
  }

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'A imagem é grande demais (máximo de 5 MB).' });
    }
    return res.status(400).json({ error: 'Envie um único arquivo de imagem no campo "imagem".' });
  }

  console.error('[erro]', err);

  if (DB_UNAVAILABLE.has(err.code)) {
    return res.status(503).json({ error: 'Banco de dados indisponível.' });
  }

  res.status(500).json({ error: 'Erro interno do servidor.' });
}
