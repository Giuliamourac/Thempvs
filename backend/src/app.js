import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { checkConnection } from './config/db.js';
import addressRoutes from './routes/addresses.routes.js';
import authRoutes from './routes/auth.routes.js';
import { categoriaRoutes, colecaoRoutes } from './routes/catalog.routes.js';
import orderRoutes from './routes/orders.routes.js';
import productRoutes from './routes/products.routes.js';
import uploadRoutes from './routes/uploads.routes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();

app.disable('x-powered-by');
if (env.trustProxy) app.set('trust proxy', env.trustProxy);

app.use(
  cors({
    origin: env.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', async (_req, res) => {
  try {
    await checkConnection();
    res.json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'error', error: 'Banco de dados indisponível.' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/colecoes', colecaoRoutes);
app.use('/api/enderecos', addressRoutes);
app.use('/api/pedidos', orderRoutes);
app.use('/api/uploads', uploadRoutes);

// Imagens enviadas (nomes aleatórios e imutáveis, então podem ficar em cache).
app.use('/uploads', express.static(env.uploadDir, { maxAge: '7d', immutable: true, index: false }));

app.use(notFound);
app.use(errorHandler);

export default app;
