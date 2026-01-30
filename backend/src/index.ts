import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/workout-planner';

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

import authRoutes from './routes/auth.routes.ts';
import exerciseRoutes from './routes/exercise.routes.ts';
import muscleGroupRoutes from './routes/musclegroup.routes.ts';
import workoutRoutes from './routes/workout.routes.ts';

app.use('/auth', authRoutes);
app.use('/exercises', exerciseRoutes);
app.use('/musclegroups', muscleGroupRoutes);
app.use('/workouts', workoutRoutes);

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to the Workout Planner API (2026 Edition)' });
});

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Database connection & Server start
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
