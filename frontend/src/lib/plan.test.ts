import { describe, expect, it } from 'vitest';
import { exercise, exercises } from '@/test/fixtures';
import {
  equipmentOptions,
  filterByEquipment,
  generatePlan,
  leastRecentlyTrained,
  planSteps,
  shuffle,
  swapExercise,
  withAvailableGroups,
} from './plan';

/** Small deterministic generator so tests are repeatable. */
function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function ids(plan: ReturnType<typeof generatePlan>) {
  return plan.map((item) => item.exercise._id);
}

function idOf(name: string, pool = exercises) {
  const found = pool.find((candidate) => candidate.name === name);
  if (!found) throw new Error(`Missing exercise fixture: ${name}`);
  return found._id;
}

describe('shuffle', () => {
  it('returns a permutation without mutating the input', () => {
    const items = [1, 2, 3, 4, 5];
    const result = shuffle(items, seededRandom(1));

    expect([...result].sort()).toEqual(items);
    expect(items).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('generatePlan', () => {
  it('takes the configured number of exercises per step and never repeats one', () => {
    const selections = {
      primary: ['Legs'],
      secondary: ['Chest', 'Upper Back'],
      finisher: ['Core'],
    };

    for (let seed = 1; seed <= 25; seed += 1) {
      const plan = generatePlan(exercises, selections, { random: seededRandom(seed) });
      const count = (stepId: string) => plan.filter((item) => item.stepId === stepId).length;

      expect(new Set(ids(plan)).size).toBe(plan.length);
      expect(count('primary')).toBe(3);
      expect(count('secondary')).toBe(2);
      expect(count('finisher')).toBe(1);
    }
  });

  it('only picks exercises from the selected groups', () => {
    const plan = generatePlan(exercises, { primary: ['Back'] }, { random: seededRandom(3) });

    expect(plan).toHaveLength(3);
    for (const item of plan) {
      expect(item.exercise.belongsTo.map((group) => group.name)).toContain('Back');
    }
  });

  it('builds a different plan when the selections change', () => {
    const backIds = new Set(ids(generatePlan(exercises, { primary: ['Back'] })));
    const legsIds = ids(generatePlan(exercises, { primary: ['Legs'] }));

    expect(legsIds.some((id) => backIds.has(id))).toBe(false);
  });

  it('leaves out exercises done recently while fresher ones are available', () => {
    const pool = [...exercises, exercise('glute bridge', ['Legs'])];
    const squatId = idOf('squat', pool);

    for (let seed = 1; seed <= 25; seed += 1) {
      const plan = generatePlan(
        pool,
        { primary: ['Legs'] },
        { random: seededRandom(seed), recentExerciseIds: new Set([squatId]) },
      );
      expect(ids(plan)).not.toContain(squatId);
    }
  });

  it('still uses recent exercises when nothing else is left', () => {
    const backIds = ['pull up', 'bent over row', 'lat pulldown'].map((name) => idOf(name));
    const plan = generatePlan(
      exercises,
      { primary: ['Back'] },
      { recentExerciseIds: new Set(backIds) },
    );

    expect(plan).toHaveLength(3);
  });
});

describe('swapExercise', () => {
  it('swaps in another exercise from the same focus without creating duplicates', () => {
    const selections = { primary: ['Legs'] };
    const pool = [...exercises, exercise('glute bridge', ['Legs'])];
    const plan = generatePlan(pool, selections, { random: seededRandom(5) });
    const swapped = swapExercise(plan, 0, pool, selections, { random: seededRandom(9) });

    expect(new Set(ids(swapped)).size).toBe(swapped.length);
    expect(swapped[0].exercise._id).not.toBe(plan[0].exercise._id);
    expect(swapped[0].exercise.belongsTo.map((group) => group.name)).toContain('Legs');
  });

  it('returns the same plan when there is nothing left to swap in', () => {
    const selections = { primary: ['Back'] };
    const plan = generatePlan(exercises, selections);

    expect(swapExercise(plan, 0, exercises, selections)).toBe(plan);
  });
});

describe('equipment', () => {
  it('keeps exercises that any of the available equipment allows', () => {
    const barbellOnly = exercise('deadlift', ['Back'], { usedWith: ['barbell'] });
    const either = exercise('row', ['Back'], { usedWith: ['barbell', 'dumbbells'] });

    expect(filterByEquipment([barbellOnly, either], ['dumbbells'])).toEqual([either]);
    expect(filterByEquipment([barbellOnly, either], null)).toHaveLength(2);
  });

  it('lists every option with bodyweight first', () => {
    const pool = [
      exercise('a', ['Legs'], { usedWith: ['dumbbells', 'bodyweight'] }),
      exercise('b', ['Legs'], { usedWith: ['barbell'] }),
    ];

    expect(equipmentOptions(pool)).toEqual(['bodyweight', 'barbell', 'dumbbells']);
  });
});

describe('leastRecentlyTrained', () => {
  it('recommends a group never trained, then the one trained longest ago', () => {
    expect(leastRecentlyTrained(['Legs', 'Back'], { Legs: '2026-09-10T00:00:00Z' })).toBe('Back');
    expect(
      leastRecentlyTrained(['Legs', 'Back'], {
        Legs: '2026-09-01T00:00:00Z',
        Back: '2026-09-10T00:00:00Z',
      }),
    ).toBe('Legs');
  });
});

describe('withAvailableGroups', () => {
  it("uses the API's spelling and drops groups that do not exist", () => {
    const steps = withAvailableGroups(planSteps, ['Legs', 'Upper back', 'Core']);

    expect(steps.find((step) => step.id === 'primary')?.options).toEqual(['Legs']);
    expect(steps.find((step) => step.id === 'secondary')?.options).toEqual(['Upper back']);
  });
});
