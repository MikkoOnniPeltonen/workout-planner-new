// Shapes of API responses (JSON-serialized, so ids and dates are strings).

export interface MuscleGroup {
  _id: string;
  name: string;
}

export type ExerciseMetric = 'reps' | 'time';

export interface Exercise {
  _id: string;
  name: string;
  description: string;
  belongsTo: MuscleGroup[];
  usedWith: string[];
  metric: ExerciseMetric;
}

export interface Workout {
  _id: string;
  name: string;
  belongsTo: string;
  exercises: Exercise[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  authToken: string;
  user: AuthUser;
}

export interface ApiErrorBody {
  message: string;
}

export interface SessionSet {
  reps?: number;
  weightKg?: number;
  durationSec?: number;
  completed: boolean;
}

export interface SessionEntry {
  exercise: Exercise;
  sets: SessionSet[];
}

export interface WorkoutSession {
  _id: string;
  belongsTo: string;
  /** The workout this session followed, or null for a freestyle session. */
  workout: string | null;
  /** Workout name at the time of logging, kept even if the workout is renamed or deleted. */
  workoutName: string;
  performedAt: string;
  durationMinutes?: number;
  notes?: string;
  entries: SessionEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface LastPerformance {
  exercise: string;
  performedAt: string;
  sets: SessionSet[];
}

export interface WeeklySummary {
  /** Local calendar date (YYYY-MM-DD) of the Monday that starts the week. */
  weekStart: string;
  sessions: number;
  sets: number;
  volumeKg: number;
}

export interface MuscleGroupSets {
  muscleGroup: string;
  sets: number;
}

export interface PersonalRecord {
  exercise: string;
  exerciseName: string;
  /** Estimated one-rep max (Epley formula). */
  bestE1rmKg: number;
  weightKg: number;
  reps: number;
  performedAt: string;
}

export interface PeriodTotals {
  sessions: number;
  sets: number;
  volumeKg: number;
}

export interface SessionStats {
  /** One entry per selected week, oldest to newest, including weeks without sessions. */
  weekly: WeeklySummary[];
  /** Totals for the selected weeks. */
  totals: PeriodTotals;
  /** Totals for the same number of weeks immediately before the selection. */
  previousTotals: PeriodTotals;
  /** All sessions ever logged. */
  totalSessions: number;
  /** Consecutive weeks with at least one session. */
  currentWeekStreak: number;
  /** Completed sets per muscle group over the selected weeks. */
  setsPerMuscleGroup: MuscleGroupSets[];
  personalRecords: PersonalRecord[];
  /** Workout id → ISO date of the most recent session. */
  lastPerformedByWorkout: Record<string, string>;
  /** Muscle group name → ISO date it was last trained. */
  lastTrainedByMuscleGroup: Record<string, string>;
}
