import authService from './auth.service';

class ExercisesService {
  getAllExercises = (muscleGroups?: string[]) => {
    const params = muscleGroups && muscleGroups.length > 0 ? { muscleGroups: muscleGroups.join(',') } : {};
    return authService.api.get('/exercises', { params });
  };

  getExerciseById = (id: string) => {
    return authService.api.get(`/exercises/${id}`);
  };
}

const exercisesService = new ExercisesService();

export default exercisesService;
