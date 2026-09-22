import type { Exercise } from '@workout-planner/shared';

export interface PlanStep {
  id: string;
  title: string;
  description: string;
  /** Muscle groups offered on this step. */
  options: string[];
  /** How many exercises this step contributes to the plan. */
  exerciseCount: number;
  /** How many groups may be picked; 1 makes it a single choice. */
  maxSelections: number;
  required: boolean;
}

export const planSteps: PlanStep[] = [
  {
    id: 'primary',
    title: 'Primary focus',
    description: 'Start with a major muscle group. It gets three exercises.',
    options: ['Legs', 'Back', 'Chest', 'Shoulders', 'Arms'],
    exerciseCount: 3,
    maxSelections: 1,
    required: true,
  },
  {
    id: 'secondary',
    title: 'Secondary focus',
    description: 'Add up to two supporting groups. They share two exercises.',
    options: ['Chest', 'Upper Back', 'Shoulders', 'Arms'],
    exerciseCount: 2,
    maxSelections: 2,
    required: false,
  },
  {
    id: 'finisher',
    title: 'Finisher',
    description: 'Finish with one core exercise.',
    options: ['Core'],
    exerciseCount: 1,
    maxSelections: 1,
    required: false,
  },
];

/** Selected muscle group names, keyed by step id. */
export type Selections = Record<string, string[]>;

export interface PlannedExercise {
  exercise: Exercise;
  /** The step that picked this exercise, or 'custom' when the user added it by hand. */
  stepId: string;
}

export type Random = () => number;

/** Keeps only options that exist in the API, using the API's spelling of each name. */
export function withAvailableGroups(steps: PlanStep[], groupNames: string[]): PlanStep[] {
  const canonical = new Map(groupNames.map((name) => [name.toLowerCase(), name]));
  return steps.map((step) => ({
    ...step,
    options: step.options.flatMap((option) => canonical.get(option.toLowerCase()) ?? []),
  }));
}

/** Every equipment option across the exercises, bodyweight first. */
export function equipmentOptions(exercises: Exercise[]): string[] {
  const options = [...new Set(exercises.flatMap((exercise) => exercise.usedWith))].sort();
  return options.includes('bodyweight')
    ? ['bodyweight', ...options.filter((option) => option !== 'bodyweight')]
    : options;
}

/** Exercises that any of the available equipment allows. `null` means everything is available. */
export function filterByEquipment(exercises: Exercise[], available: string[] | null): Exercise[] {
  if (available === null) return exercises;
  return exercises.filter(
    (exercise) =>
      exercise.usedWith.length === 0 || exercise.usedWith.some((item) => available.includes(item)),
  );
}

/** The option trained longest ago; one that was never trained counts as longest ago. */
export function leastRecentlyTrained(
  options: string[],
  lastTrainedByGroup: Record<string, string>,
): string | undefined {
  let recommended: string | undefined;
  let oldest = Number.POSITIVE_INFINITY;
  for (const option of options) {
    const date = lastTrainedByGroup[option];
    const trainedAt = date ? Date.parse(date) : Number.NEGATIVE_INFINITY;
    if (trainedAt < oldest) {
      recommended = option;
      oldest = trainedAt;
    }
  }
  return recommended;
}

/** Fisher–Yates shuffle. Returns a new array. */
export function shuffle<T>(items: readonly T[], random: Random = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function belongsToAny(exercise: Exercise, groups: string[]): boolean {
  return exercise.belongsTo.some((group) => groups.includes(group.name));
}

interface PlanOptions {
  steps?: PlanStep[];
  random?: Random;
  /** Exercises done recently. They are only picked when nothing fresher is left. */
  recentExerciseIds?: ReadonlySet<string>;
}

/** Fresh exercises in random order, then recently done ones in random order. */
function prioritize(candidates: Exercise[], recent: ReadonlySet<string>, random: Random) {
  const fresh = candidates.filter((exercise) => !recent.has(exercise._id));
  const done = candidates.filter((exercise) => recent.has(exercise._id));
  return [...shuffle(fresh, random), ...shuffle(done, random)];
}

export function generatePlan(
  exercises: Exercise[],
  selections: Selections,
  { steps = planSteps, random = Math.random, recentExerciseIds = new Set() }: PlanOptions = {},
): PlannedExercise[] {
  const plan: PlannedExercise[] = [];
  const usedIds = new Set<string>();

  for (const step of steps) {
    const groups = selections[step.id] ?? [];
    if (groups.length === 0) continue;

    const candidates = exercises.filter(
      (exercise) => !usedIds.has(exercise._id) && belongsToAny(exercise, groups),
    );
    const picked = prioritize(candidates, recentExerciseIds, random).slice(0, step.exerciseCount);
    for (const exercise of picked) {
      usedIds.add(exercise._id);
      plan.push({ exercise, stepId: step.id });
    }
  }

  return plan;
}

/**
 * Replaces the item at `index` with another exercise from the same step's groups, preferring ones
 * not done recently. Returns the same array when there is nothing to swap in.
 */
export function swapExercise(
  plan: PlannedExercise[],
  index: number,
  exercises: Exercise[],
  selections: Selections,
  { random = Math.random, recentExerciseIds = new Set() }: Omit<PlanOptions, 'steps'> = {},
): PlannedExercise[] {
  const target = plan[index];
  if (!target) return plan;

  const groups = selections[target.stepId] ?? [];
  const usedIds = new Set(plan.map((item) => item.exercise._id));
  const candidates = exercises.filter(
    (exercise) => !usedIds.has(exercise._id) && belongsToAny(exercise, groups),
  );
  if (candidates.length === 0) return plan;

  const fresh = candidates.filter((exercise) => !recentExerciseIds.has(exercise._id));
  const pool = fresh.length > 0 ? fresh : candidates;
  const replacement = pool[Math.floor(random() * pool.length)];
  return plan.map((item, i) => (i === index ? { ...item, exercise: replacement } : item));
}
