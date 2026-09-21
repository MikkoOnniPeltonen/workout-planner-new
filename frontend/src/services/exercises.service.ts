import type { Exercise, MuscleGroup } from '@workout-planner/shared';
import { api } from '@/lib/api';

class ExercisesService {
  getAllExercises = async (muscleGroups: string[] = []) => {
    const params = muscleGroups.length > 0 ? { muscleGroups: muscleGroups.join(',') } : undefined;
    const response = await api.get<Exercise[]>('/exercises', { params });
    return response.data;
  };

  getMuscleGroups = async () => {
    const response = await api.get<MuscleGroup[]>('/musclegroups');
    return response.data;
  };
}

const exercisesService = new ExercisesService();

export default exercisesService;
