import type { Exercise, MuscleGroup, SessionStats } from '@workout-planner/shared';

let nextId = 1;

/** A unique, valid-looking MongoDB ObjectId, so fixtures pass the shared schemas. */
export function objectId(): string {
  const id = nextId.toString(16).padStart(24, '0');
  nextId += 1;
  return id;
}

const groupIds = new Map<string, string>();

export function muscleGroup(name: string): MuscleGroup {
  let id = groupIds.get(name);
  if (!id) {
    id = objectId();
    groupIds.set(name, id);
  }
  return { _id: id, name };
}

export function exercise(
  name: string,
  groups: string[],
  overrides: Partial<Exercise> = {},
): Exercise {
  return {
    _id: objectId(),
    name,
    description: `How to do a ${name}.`,
    usedWith: ['bodyweight'],
    metric: 'reps',
    belongsTo: groups.map(muscleGroup),
    ...overrides,
  };
}

export const muscleGroups = [
  'Arms',
  'Back',
  'Chest',
  'Core',
  'Legs',
  'Shoulders',
  'Upper Back',
].map(muscleGroup);

export const exercises: Exercise[] = [
  exercise('squat', ['Legs', 'Core']),
  exercise('lunge', ['Legs']),
  exercise('leg press', ['Legs']),
  exercise('pull up', ['Back', 'Arms']),
  exercise('bent over row', ['Back']),
  exercise('lat pulldown', ['Back']),
  exercise('bench press', ['Chest', 'Arms']),
  exercise('shrug', ['Upper Back']),
  exercise('plank', ['Core'], { metric: 'time' }),
];

export function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export function sessionStats(overrides: Partial<SessionStats> = {}): SessionStats {
  const noTotals = { sessions: 0, sets: 0, volumeKg: 0 };
  return {
    weekly: [],
    totals: noTotals,
    previousTotals: noTotals,
    totalSessions: 0,
    currentWeekStreak: 0,
    setsPerMuscleGroup: [],
    personalRecords: [],
    lastPerformedByWorkout: {},
    lastTrainedByMuscleGroup: {},
    ...overrides,
  };
}
