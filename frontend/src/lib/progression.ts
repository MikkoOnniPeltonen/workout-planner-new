import type { ExerciseMetric, SessionSet } from '@workout-planner/shared';

export const WEIGHT_STEP_KG = 2.5;
export const TIME_STEP_SEC = 5;

export interface SetTarget {
  reps?: number;
  weightKg?: number;
  durationSec?: number;
  /** True when this target is a step up from last time. */
  increased: boolean;
}

/**
 * Double progression. When every set last time was completed and none fell short of the first
 * set, aim one step higher: +2.5 kg on weighted sets, +1 rep on bodyweight sets, +5 s on timed
 * sets. Otherwise, repeat last time's numbers.
 */
export function progressionTargets(
  lastSets: SessionSet[] | undefined,
  metric: ExerciseMetric,
): SetTarget[] {
  if (!lastSets || lastSets.length === 0) return [];

  const measure = (set: SessionSet) => (metric === 'time' ? set.durationSec : set.reps) ?? 0;
  const goal = measure(lastSets[0]);
  const earnedStep = goal > 0 && lastSets.every((set) => set.completed && measure(set) >= goal);

  return lastSets.map((set) => {
    const repeat = {
      reps: set.reps,
      weightKg: set.weightKg,
      durationSec: set.durationSec,
      increased: false,
    };
    if (!earnedStep) return repeat;
    if (metric === 'time') {
      return { ...repeat, durationSec: (set.durationSec ?? 0) + TIME_STEP_SEC, increased: true };
    }
    if (set.weightKg) {
      return { ...repeat, weightKg: set.weightKg + WEIGHT_STEP_KG, increased: true };
    }
    return { ...repeat, reps: (set.reps ?? 0) + 1, increased: true };
  });
}

/** A short badge describing the step up, or undefined when the targets repeat last time. */
export function describeIncrease(targets: SetTarget[], metric: ExerciseMetric): string | undefined {
  if (!targets.some((target) => target.increased)) return undefined;
  if (metric === 'time') return `Aim for +${TIME_STEP_SEC} s per set`;
  if (targets.some((target) => target.weightKg)) return `Aim for +${WEIGHT_STEP_KG} kg`;
  return 'Aim for +1 rep per set';
}
