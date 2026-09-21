import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { databaseState } from './config/database.ts';
import { env } from './config/env.ts';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.ts';
import authRoutes from './routes/auth.routes.ts';
import exerciseRoutes from './routes/exercise.routes.ts';
import muscleGroupRoutes from './routes/musclegroup.routes.ts';
import sessionRoutes from './routes/session.routes.ts';
import workoutRoutes from './routes/workout.routes.ts';

export function createApp() {
  const app = express();

  app.set('trust proxy', env.TRUST_PROXY);
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN }));
  if (env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }
  app.use(express.json({ limit: '100kb' }));

  app.get('/', (_req, res) => {
    res.json({ message: 'Welcome to the Workout Planner API' });
  });
  app.get('/health', (_req, res) => {
    const database = databaseState();
    const healthy = database === 'connected';
    res.status(healthy ? 200 : 503).json({ status: healthy ? 'ok' : 'unavailable', database });
  });

  app.use('/auth', authRoutes);
  app.use('/exercises', exerciseRoutes);
  app.use('/musclegroups', muscleGroupRoutes);
  app.use('/workouts', workoutRoutes);
  app.use('/sessions', sessionRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
