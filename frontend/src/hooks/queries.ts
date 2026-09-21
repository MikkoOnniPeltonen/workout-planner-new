import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { SessionInput, SessionUpdateInput, WorkoutInput } from '@workout-planner/shared';
import exercisesService from '@/services/exercises.service';
import sessionsService from '@/services/sessions.service';
import workoutsService from '@/services/workouts.service';

const FIVE_MINUTES = 5 * 60 * 1000;
const HISTORY_PAGE_SIZE = 20;

export const queryKeys = {
  exercises: ['exercises'] as const,
  muscleGroups: ['muscle-groups'] as const,
  workouts: ['workouts'] as const,
  workout: (id: string) => ['workouts', id] as const,
  sessions: ['sessions'] as const,
  sessionHistory: ['sessions', 'history'] as const,
  session: (id: string) => ['sessions', 'detail', id] as const,
  lastPerformance: (exerciseIds: string[]) =>
    ['sessions', 'last-performance', [...exerciseIds].sort().join(',')] as const,
  stats: ['stats'] as const,
  statsFor: (weeks: number, timeZone: string) => ['stats', weeks, timeZone] as const,
};

export function useExercises() {
  return useQuery({
    queryKey: queryKeys.exercises,
    queryFn: () => exercisesService.getAllExercises(),
    staleTime: FIVE_MINUTES,
  });
}

export function useMuscleGroups() {
  return useQuery({
    queryKey: queryKeys.muscleGroups,
    queryFn: () => exercisesService.getMuscleGroups(),
    staleTime: FIVE_MINUTES,
  });
}

export function useWorkouts() {
  return useQuery({
    queryKey: queryKeys.workouts,
    queryFn: () => workoutsService.getAllWorkouts(),
  });
}

export function useWorkout(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workout(id ?? ''),
    queryFn: () => workoutsService.getWorkoutById(id ?? ''),
    enabled: Boolean(id),
  });
}

function useInvalidateWorkouts() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.workouts });
}

export function useCreateWorkout() {
  const invalidateWorkouts = useInvalidateWorkouts();
  return useMutation({
    mutationFn: (input: WorkoutInput) => workoutsService.createWorkout(input),
    onSuccess: invalidateWorkouts,
  });
}

export function useUpdateWorkout() {
  const invalidateWorkouts = useInvalidateWorkouts();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: WorkoutInput }) =>
      workoutsService.updateWorkout(id, input),
    onSuccess: invalidateWorkouts,
  });
}

export function useDeleteWorkout() {
  const invalidateWorkouts = useInvalidateWorkouts();
  return useMutation({
    mutationFn: (id: string) => workoutsService.deleteWorkout(id),
    onSuccess: invalidateWorkouts,
  });
}

export function useSessionHistory() {
  return useInfiniteQuery({
    queryKey: queryKeys.sessionHistory,
    queryFn: ({ pageParam }) =>
      sessionsService.getSessions({ limit: HISTORY_PAGE_SIZE, before: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.length === HISTORY_PAGE_SIZE ? lastPage.at(-1)?.performedAt : undefined,
  });
}

export function useSession(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.session(id ?? ''),
    queryFn: () => sessionsService.getSession(id ?? ''),
    enabled: Boolean(id),
  });
}

/** The most recent sets logged for each exercise. Keeps the previous result while ids change. */
export function useLastPerformance(exerciseIds: string[]) {
  return useQuery({
    queryKey: queryKeys.lastPerformance(exerciseIds),
    queryFn: () => sessionsService.getLastPerformance(exerciseIds),
    enabled: exerciseIds.length > 0,
    placeholderData: keepPreviousData,
    staleTime: FIVE_MINUTES,
  });
}

export function useSessionStats(weeks = 12) {
  // Weeks are bucketed in the viewer's own time zone.
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return useQuery({
    queryKey: queryKeys.statsFor(weeks, timeZone),
    queryFn: () => sessionsService.getStats(weeks, timeZone),
    placeholderData: keepPreviousData,
  });
}

function useInvalidateSessions() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions }),
      queryClient.invalidateQueries({ queryKey: queryKeys.stats }),
    ]);
}

export function useCreateSession() {
  const invalidateSessions = useInvalidateSessions();
  return useMutation({
    mutationFn: (input: SessionInput) => sessionsService.createSession(input),
    onSuccess: invalidateSessions,
  });
}

export function useUpdateSession() {
  const invalidateSessions = useInvalidateSessions();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SessionUpdateInput }) =>
      sessionsService.updateSession(id, input),
    onSuccess: invalidateSessions,
  });
}

export function useDeleteSession() {
  const invalidateSessions = useInvalidateSessions();
  return useMutation({
    mutationFn: (id: string) => sessionsService.deleteSession(id),
    onSuccess: invalidateSessions,
  });
}
