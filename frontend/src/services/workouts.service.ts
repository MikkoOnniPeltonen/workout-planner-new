import type { Workout, WorkoutInput } from '@workout-planner/shared';
import { api } from '@/lib/api';

class WorkoutsService {
  getAllWorkouts = async () => {
    const response = await api.get<Workout[]>('/workouts');
    return response.data;
  };

  getWorkoutById = async (id: string) => {
    const response = await api.get<Workout>(`/workouts/${id}`);
    return response.data;
  };

  createWorkout = async (input: WorkoutInput) => {
    const response = await api.post<Workout>('/workouts', input);
    return response.data;
  };

  updateWorkout = async (id: string, input: WorkoutInput) => {
    const response = await api.put<Workout>(`/workouts/${id}`, input);
    return response.data;
  };

  deleteWorkout = async (id: string) => {
    await api.delete(`/workouts/${id}`);
  };
}

const workoutsService = new WorkoutsService();

export default workoutsService;
