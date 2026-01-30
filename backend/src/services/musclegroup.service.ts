import { MuscleGroup } from '../models/MuscleGroup.model.ts';

class MuscleGroupService {
    async getAllMuscleGroups() {
        return await MuscleGroup.find();
    }
}

export const muscleGroupService = new MuscleGroupService();
