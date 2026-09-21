import type {
  LastPerformance,
  SessionInput,
  SessionStats,
  SessionUpdateInput,
  WorkoutSession,
} from '@workout-planner/shared';
import { api } from '@/lib/api';

class SessionsService {
  getSessions = async (params: { limit?: number; before?: string } = {}) => {
    const response = await api.get<WorkoutSession[]>('/sessions', { params });
    return response.data;
  };

  getSession = async (id: string) => {
    const response = await api.get<WorkoutSession>(`/sessions/${id}`);
    return response.data;
  };

  createSession = async (input: SessionInput) => {
    const response = await api.post<WorkoutSession>('/sessions', input);
    return response.data;
  };

  updateSession = async (id: string, input: SessionUpdateInput) => {
    const response = await api.put<WorkoutSession>(`/sessions/${id}`, input);
    return response.data;
  };

  deleteSession = async (id: string) => {
    await api.delete(`/sessions/${id}`);
  };

  getLastPerformance = async (exerciseIds: string[]) => {
    const response = await api.get<LastPerformance[]>('/sessions/last-performance', {
      params: { exercises: exerciseIds.join(',') },
    });
    return response.data;
  };

  getStats = async (weeks: number, timeZone: string) => {
    const response = await api.get<SessionStats>('/sessions/stats', {
      params: { weeks, tz: timeZone },
    });
    return response.data;
  };
}

const sessionsService = new SessionsService();

export default sessionsService;
