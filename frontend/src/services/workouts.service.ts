import authService from './auth.service';

interface CreateWorkoutData {
  name: string;
  exercises: string[]; // array of exercise IDs
}

class WorkoutsService {
  getAllWorkouts = () => {
    return authService.api.get('/workouts');
  };

  getWorkoutById = (id: string) => {
    return authService.api.get(`/workouts/${id}`);
  };

  createWorkout = (data: CreateWorkoutData) => {
    return authService.api.post('/workouts', data);
  };

  updateWorkout = (id: string, data: Partial<CreateWorkoutData>) => {
    return authService.api.put(`/workouts/${id}`, data);
  };

  deleteWorkout = (id: string) => {
    return authService.api.delete(`/workouts/${id}`);
  };
}

const workoutsService = new WorkoutsService();

export default workoutsService;
