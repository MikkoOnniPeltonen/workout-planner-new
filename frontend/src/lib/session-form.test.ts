import type { ExerciseMetric } from '@workout-planner/shared';
import { describe, expect, it } from 'vitest';
import {
  completeSet,
  countSets,
  emptySet,
  newEntry,
  parseNumber,
  type SessionFormValues,
  targetSet,
  toSessionPayload,
} from './session-form';

const metricOf = (exerciseId: string): ExerciseMetric => (exerciseId === 'plank' ? 'time' : 'reps');

describe('parseNumber', () => {
  it('accepts decimal commas and ignores blanks', () => {
    expect(parseNumber('62,5')).toBe(62.5);
    expect(parseNumber(' 8 ')).toBe(8);
    expect(parseNumber('')).toBeUndefined();
    expect(parseNumber('abc')).toBeUndefined();
  });
});

describe('completeSet', () => {
  it("fills blanks from last time's numbers and keeps what was typed", () => {
    const set = { ...emptySet(), reps: '10' };

    expect(completeSet(set, { reps: 8, weightKg: 60 })).toEqual({
      reps: '10',
      weightKg: '60',
      durationSec: '',
      completed: true,
    });
  });

  it('targets the same set number, or the last set when this one is new', () => {
    const lastSets = [
      { reps: 8, completed: true },
      { reps: 6, completed: true },
    ];

    expect(targetSet(lastSets, 1)?.reps).toBe(6);
    expect(targetSet(lastSets, 3)?.reps).toBe(6);
    expect(targetSet(undefined, 0)).toBeUndefined();
  });
});

describe('toSessionPayload', () => {
  const values: SessionFormValues = {
    performedAt: '2026-09-14T18:30',
    durationMinutes: '55',
    notes: '  ',
    entries: [
      {
        exerciseId: 'squat',
        sets: [
          { reps: '5', weightKg: '100', durationSec: '', completed: true },
          { reps: '5', weightKg: '100', durationSec: '', completed: false },
          emptySet(),
        ],
      },
      {
        exerciseId: 'plank',
        sets: [{ reps: '', weightKg: '', durationSec: '45', completed: true }],
      },
      newEntry('lunge'),
    ],
  };

  it('keeps ticked-off sets, converts numbers and drops exercises without sets', () => {
    expect(toSessionPayload(values, metricOf)).toEqual({
      performedAt: new Date('2026-09-14T18:30').toISOString(),
      durationMinutes: 55,
      notes: undefined,
      entries: [
        { exercise: 'squat', sets: [{ reps: 5, weightKg: 100, completed: true }] },
        { exercise: 'plank', sets: [{ durationSec: 45, completed: true }] },
      ],
    });
  });

  it('can also keep filled-in sets that were not ticked off', () => {
    expect(countSets(values.entries, metricOf)).toEqual({ done: 2, unticked: 1 });
    expect(
      toSessionPayload(values, metricOf, { includeUnticked: true }).entries[0].sets,
    ).toHaveLength(2);
  });
});
