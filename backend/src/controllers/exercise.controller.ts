import type { Request, Response } from 'express';
import { exerciseService } from '../services/exercise.service.ts';

class ExerciseController {
    async getAllExercises(req: Request, res: Response) {
        try {
            const { muscleGroups } = req.query;
            const muscleGroupsStr = Array.isArray(muscleGroups)
                ? (muscleGroups as string[]).join(',')
                : (muscleGroups as string);
            const exercises = await exerciseService.getAllExercises(muscleGroupsStr);
            res.status(200).json(exercises);
        } catch (error) {
            console.error('Error getting exercises:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    async getExerciseById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const exercise = await exerciseService.getExerciseById(id as string);

            if (!exercise) {
                res.status(404).json({ message: 'Exercise not found' });
                return;
            }

            res.status(200).json(exercise);
        } catch (error) {
            console.error('Error getting exercise:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
}

export const exerciseController = new ExerciseController();
