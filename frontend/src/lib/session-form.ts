import type {
  ExerciseMetric,
  SessionSet,
  SessionUpdateInput,
  WorkoutSession,
} from '@workout-planner/shared';
import { toDateTimeLocalValue } from '@/lib/dates';

// The logger keeps every input as the string the user typed, and converts on save.

export const DEFAULT_SET_COUNT = 3;

export interface SetFormValues {
  reps: string;
  weightKg: string;
  durationSec: string;
  completed: boolean;
}

export interface EntryFormValues {
  exerciseId: string;
  sets: SetFormValues[];
}

export interface SessionFormValues {
  performedAt: string;
  durationMinutes: string;
  notes: string;
  entries: EntryFormValues[];
}

export type MetricLookup = (exerciseId: string) => ExerciseMetric;

export function emptySet(): SetFormValues {
  return { reps: '', weightKg: '', durationSec: '', completed: false };
}

export function newEntry(exerciseId: string, setCount = DEFAULT_SET_COUNT): EntryFormValues {
  return { exerciseId, sets: Array.from({ length: Math.max(1, setCount) }, emptySet) };
}

export function emptySessionValues(
  entries: EntryFormValues[] = [],
  now = new Date(),
): SessionFormValues {
  return { performedAt: toDateTimeLocalValue(now), durationMinutes: '', notes: '', entries };
}

export function sessionToFormValues(session: WorkoutSession): SessionFormValues {
  return {
    performedAt: toDateTimeLocalValue(new Date(session.performedAt)),
    durationMinutes: session.durationMinutes?.toString() ?? '',
    notes: session.notes ?? '',
    entries: session.entries.map((entry) => ({
      exerciseId: entry.exercise._id,
      sets: entry.sets.map((set) => ({
        reps: set.reps?.toString() ?? '',
        weightKg: set.weightKg?.toString() ?? '',
        durationSec: set.durationSec?.toString() ?? '',
        completed: set.completed,
      })),
    })),
  };
}

/** Rejects anything in storage that does not look like logger form values. */
export function isSessionFormValues(value: unknown): value is SessionFormValues {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<SessionFormValues>;
  return (
    typeof candidate.performedAt === 'string' &&
    Array.isArray(candidate.entries) &&
    candidate.entries.every(
      (entry) => typeof entry?.exerciseId === 'string' && Array.isArray(entry.sets),
    )
  );
}

/** Parses a number typed by the user, accepting a decimal comma. Blank or invalid gives undefined. */
export function parseNumber(value: string): number | undefined {
  const normalized = value.trim().replace(',', '.');
  if (normalized === '') return undefined;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : undefined;
}

export function isSetFilled(set: SetFormValues, metric: ExerciseMetric): boolean {
  return parseNumber(metric === 'time' ? set.durationSec : set.reps) !== undefined;
}

/** The target for a set: the same set number from last time, or last time's final set. */
export function targetSet<T>(targets: T[] | undefined, setIndex: number): T | undefined {
  return targets?.[setIndex] ?? targets?.at(-1);
}

/** Marks a set done, filling any blank fields from the target. */
export function completeSet(
  set: SetFormValues,
  target: Pick<SessionSet, 'reps' | 'weightKg' | 'durationSec'> | undefined,
): SetFormValues {
  return {
    reps: set.reps || (target?.reps?.toString() ?? ''),
    weightKg: set.weightKg || (target?.weightKg?.toString() ?? ''),
    durationSec: set.durationSec || (target?.durationSec?.toString() ?? ''),
    completed: true,
  };
}

/** Ticked-off sets, and filled-in sets that have not been ticked off. */
export function countSets(entries: EntryFormValues[], metricOf: MetricLookup) {
  let done = 0;
  let unticked = 0;
  for (const entry of entries) {
    const metric = metricOf(entry.exerciseId);
    for (const set of entry.sets) {
      if (set.completed) {
        done += 1;
      } else if (isSetFilled(set, metric)) {
        unticked += 1;
      }
    }
  }
  return { done, unticked };
}

/**
 * Builds the API payload. Blank rows and exercises without sets are dropped; filled-in sets that
 * were not ticked off are kept only with `includeUnticked`.
 */
export function toSessionPayload(
  values: SessionFormValues,
  metricOf: MetricLookup,
  { includeUnticked = false } = {},
): SessionUpdateInput {
  const performedAt = new Date(values.performedAt);

  const entries = values.entries
    .map((entry) => {
      const metric = metricOf(entry.exerciseId);
      const sets = entry.sets
        .filter((set) => isSetFilled(set, metric) && (set.completed || includeUnticked))
        .map((set) =>
          metric === 'time'
            ? { durationSec: parseNumber(set.durationSec), completed: true }
            : { reps: parseNumber(set.reps), weightKg: parseNumber(set.weightKg), completed: true },
        );
      return { exercise: entry.exerciseId, sets };
    })
    .filter((entry) => entry.sets.length > 0);

  return {
    performedAt: Number.isNaN(performedAt.getTime()) ? '' : performedAt.toISOString(),
    durationMinutes: parseNumber(values.durationMinutes),
    notes: values.notes.trim() || undefined,
    entries,
  };
}
