import path from 'node:path';
import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { databaseState } from './config/database.ts';
import { env } from './config/env.ts';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.ts';
import { requestLog } from './middleware/request-log.middleware.ts';
import { csrfProtection } from './middleware/session.middleware.ts';
import authRoutes from './routes/auth.routes.ts';
import exerciseRoutes from './routes/exercise.routes.ts';
import muscleGroupRoutes from './routes/musclegroup.routes.ts';
import sessionRoutes from './routes/session.routes.ts';
import workoutRoutes from './routes/workout.routes.ts';

export function createApp({ serveFrontend = env.NODE_ENV === 'production' } = {}) {
  const app = express();

  app.set('trust proxy', env.TRUST_PROXY);
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  if (env.NODE_ENV !== 'test') app.use(requestLog);
  app.disable('x-powered-by');
  app.use(
    '/api',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 600,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      skip: () => env.NODE_ENV === 'test',
      message: { message: 'Too many requests. Please try again later.' },
    }),
  );
  app.use(express.json({ limit: '100kb', inflate: false }));
  app.use(csrfProtection);

  const api = express.Router();
  api.get('/', (_req, res) => res.json({ message: 'Workout Planner API' }));
  api.get('/health', (_req, res) => {
    const database = databaseState();
    const healthy = database === 'connected';
    res.status(healthy ? 200 : 503).json({ status: healthy ? 'ok' : 'unavailable', database });
  });
  api.use('/auth', authRoutes);
  api.use('/exercises', exerciseRoutes);
  api.use('/musclegroups', muscleGroupRoutes);
  api.use('/workouts', workoutRoutes);
  api.use('/sessions', sessionRoutes);
  app.use('/api', api);
  if (!serveFrontend) app.use('/', api);

  if (serveFrontend) {
    const publicDir = path.resolve(import.meta.dirname, '../../frontend/dist');
    app.use(express.static(publicDir, { index: false }));
    app.get('/{*page}', (req, res, next) => {
      if (req.path === '/api' || req.path.startsWith('/api/') || path.extname(req.path))
        return next();
      res.set('Cache-Control', 'no-cache').sendFile(path.join(publicDir, 'index.html'));
    });
  }
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
