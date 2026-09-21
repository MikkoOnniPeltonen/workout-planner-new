import type { Request, Response } from 'express';
import { z } from 'zod';
import { exerciseService } from '../services/exercise.service.ts';
import { HttpError } from '../utils/http-error.ts';
import { idParamsSchema, validate } from '../utils/validate.ts';

const listQuerySchema = z.object({
  // Accepts ?muscleGroups=Legs,Back as well as ?muscleGroups=Legs&muscleGroups=Back.
  muscleGroups: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((value) =>
      [value ?? []]
        .flat()
        .flatMap((names) => names.split(','))
        .map((name) => name.trim())
        .filter(Boolean),
    ),
});

class ExerciseController {
  async getAllExercises(req: Request, res: Response) {
    const { muscleGroups } = validate(listQuerySchema, req.query);
    res.json(await exerciseService.getAllExercises(muscleGroups));
  }

  async getExerciseById(req: Request, res: Response) {
    const { id } = validate(idParamsSchema, req.params);
    const exercise = await exerciseService.getExerciseById(id);

    if (!exercise) {
      throw new HttpError(404, 'Exercise not found');
    }

    res.json(exercise);
  }
}

export const exerciseController = new ExerciseController();
