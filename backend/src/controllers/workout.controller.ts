import { workoutInputSchema } from '@workout-planner/shared';
import type { Request, Response } from 'express';
import { getAuth } from '../middleware/jwt.middleware.ts';
import { workoutService } from '../services/workout.service.ts';
import { HttpError } from '../utils/http-error.ts';
import { idParamsSchema, validate } from '../utils/validate.ts';

class WorkoutController {
  async getAllWorkouts(req: Request, res: Response) {
    const { _id: userId } = getAuth(req);
    res.json(await workoutService.getAllWorkouts(userId));
  }

  async getWorkoutById(req: Request, res: Response) {
    const { _id: userId } = getAuth(req);
    const { id } = validate(idParamsSchema, req.params);
    const workout = await workoutService.getWorkoutById(id, userId);

    if (!workout) {
      throw new HttpError(404, 'Workout not found');
    }

    res.json(workout);
  }

  async createWorkout(req: Request, res: Response) {
    const { _id: userId } = getAuth(req);
    const input = validate(workoutInputSchema, req.body);
    res.status(201).json(await workoutService.createWorkout(userId, input));
  }

  async updateWorkout(req: Request, res: Response) {
    const { _id: userId } = getAuth(req);
    const { id } = validate(idParamsSchema, req.params);
    const input = validate(workoutInputSchema, req.body);
    const workout = await workoutService.updateWorkout(id, userId, input);

    if (!workout) {
      throw new HttpError(404, 'Workout not found');
    }

    res.json(workout);
  }

  async deleteWorkout(req: Request, res: Response) {
    const { _id: userId } = getAuth(req);
    const { id } = validate(idParamsSchema, req.params);
    const workout = await workoutService.deleteWorkout(id, userId);

    if (!workout) {
      throw new HttpError(404, 'Workout not found');
    }

    res.status(204).end();
  }
}

export const workoutController = new WorkoutController();
