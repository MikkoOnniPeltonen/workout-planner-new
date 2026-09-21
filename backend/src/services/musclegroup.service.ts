import { MuscleGroup } from '../models/MuscleGroup.model.ts';

class MuscleGroupService {
  async getAllMuscleGroups() {
    return MuscleGroup.find().sort({ name: 1 });
  }
}

export const muscleGroupService = new MuscleGroupService();
