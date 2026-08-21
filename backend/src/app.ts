import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import yaml from 'yamljs';
import swaggerUi from 'swagger-ui-express';
import routes from './routes/index.js';
import healthRoutes from './routes/health.routes.js';
import publicApiRoutes from './routes/public-api.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { requestLogger } from './middlewares/requestLogger.js';

export function createApp(): Express {
  const app = express();

  // Middlewares de Segurança e Configuração
  app.use(helmet({
    contentSecurityPolicy: false, // Permitir Swagger UI
  }));
  app.use(cors({
    origin: true,
    credentials: true,
  }));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Logger de Requisições
  app.use(requestLogger);

  // Health Checks (Públicos sem auth)
  app.use('/health', healthRoutes);
  app.use('/api/health', healthRoutes);

  // Swagger Documentation
  const swaggerPath = path.resolve(process.cwd(), '../docs/openapi.yaml');
  const fallbackSwaggerPath = path.resolve(process.cwd(), 'docs/openapi.yaml');

  const pathToUse = fs.existsSync(swaggerPath)
    ? swaggerPath
    : fs.existsSync(fallbackSwaggerPath)
    ? fallbackSwaggerPath
    : null;

  if (pathToUse) {
    try {
      const swaggerDocument = yaml.load(pathToUse);
      app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    } catch (err) {
      console.warn('[Swagger] Não foi possível carregar o arquivo openapi.yaml:', err);
    }
  }

  // Rotas da API e Endpoints Públicos/Autenticados
  app.use('/api', routes);
  app.use('/', publicApiRoutes);

  // Middleware Central de Erros
  app.use(errorHandler);

  return app;
}
