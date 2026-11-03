import { HttpError } from '../utils/httpError.js';
import { idSchema } from '../validators/product.schema.js';

const formatIssues = (issues) =>
  issues.map((issue) => ({
    campo: issue.path.join('.') || 'body',
    mensagem: issue.message,
  }));

/** Valida req.body com um schema Zod e substitui por dados já limpos/convertidos. */
export const validateBody = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    throw new HttpError(400, 'Dados inválidos.', formatIssues(result.error.issues));
  }
  req.body = result.data;
  next();
};

/** Valida a query string (?pagina=2&status=Pago) e coloca o resultado em req.query. */
export const validateQuery = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.query ?? {});
  if (!result.success) {
    throw new HttpError(400, 'Parâmetros inválidos.', formatIssues(result.error.issues));
  }
  // No Express 5 req.query é somente leitura: sobrescreve a propriedade.
  Object.defineProperty(req, 'query', { value: result.data, configurable: true, enumerable: true });
  next();
};

/** Valida o parâmetro :id e o disponibiliza como número em req.id (e req.productId). */
export const validateId = (req, _res, next) => {
  const result = idSchema.safeParse(req.params.id);
  if (!result.success) throw new HttpError(400, 'ID inválido.');
  req.id = result.data;
  req.productId = result.data;
  next();
};
