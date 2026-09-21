import type { SessionSet } from '@workout-planner/shared';
import { describe, expect, it } from 'vitest';
import { describeIncrease, progressionTargets } from './progression';

function done(reps: number, weightKg?: number): SessionSet {
  return { reps, weightKg, completed: true };
}

describe('progressionTargets', () => {
  it('adds 2.5 kg when every set reached its reps', () => {
    const targets = progressionTargets([done(8, 60), done(8, 60), done(8, 60)], 'reps');

    expect(targets.map((target) => target.weightKg)).toEqual([62.5, 62.5, 62.5]);
    expect(targets.map((target) => target.reps)).toEqual([8, 8, 8]);
    expect(describeIncrease(targets, 'reps')).toBe('Aim for +2.5 kg');
  });

  it('repeats the numbers when reps dropped off', () => {
    const targets = progressionTargets([done(8, 60), done(8, 60), done(6, 60)], 'reps');

    expect(targets.some((target) => target.increased)).toBe(false);
    expect(targets[2]).toMatchObject({ reps: 6, weightKg: 60 });
    expect(describeIncrease(targets, 'reps')).toBeUndefined();
  });

  it('only suggests an increase when every set was completed', () => {
    const targets = progressionTargets(
      [done(8, 60), { reps: 8, weightKg: 60, completed: false }],
      'reps',
    );

    expect(targets.some((target) => target.increased)).toBe(false);
  });

  it('adds a rep to bodyweight sets and 5 seconds to timed sets', () => {
    expect(progressionTargets([done(12), done(12)], 'reps').map((target) => target.reps)).toEqual([
      13, 13,
    ]);

    const timed = progressionTargets(
      [
        { durationSec: 45, completed: true },
        { durationSec: 50, completed: true },
      ],
      'time',
    );
    expect(timed.map((target) => target.durationSec)).toEqual([50, 55]);
    expect(describeIncrease(timed, 'time')).toBe('Aim for +5 s per set');
  });

  it('has no targets without history', () => {
    expect(progressionTargets(undefined, 'reps')).toEqual([]);
  });
});
