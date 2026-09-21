import type { Request, Response } from 'express';
import { muscleGroupService } from '../services/musclegroup.service.ts';

class MuscleGroupController {
  async getAllMuscleGroups(_req: Request, res: Response) {
    res.json(await muscleGroupService.getAllMuscleGroups());
  }
}

export const muscleGroupController = new MuscleGroupController();
