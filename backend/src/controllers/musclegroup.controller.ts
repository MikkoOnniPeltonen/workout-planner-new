import type { Request, Response } from 'express';
import { muscleGroupService } from '../services/musclegroup.service.ts';

class MuscleGroupController {
    async getAllMuscleGroups(req: Request, res: Response) {
        try {
            const muscleGroups = await muscleGroupService.getAllMuscleGroups();
            res.status(200).json(muscleGroups);
        } catch (error) {
            console.error('Error getting muscle groups:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
}

export const muscleGroupController = new MuscleGroupController();
