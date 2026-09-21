import { describe, expect, it } from 'vitest';
import { Exercise } from '../src/models/Exercise.model.ts';
import { MuscleGroup } from '../src/models/MuscleGroup.model.ts';
import { muscleGroupNames, seedDatabase } from '../src/scripts/seed-data.ts';

async function exerciseIds() {
  const exercises = await Exercise.find().sort({ name: 1 });
  return exercises.map((exercise) => String(exercise._id));
}

describe('seedDatabase', () => {
  it('can run repeatedly without changing ids', async () => {
    await seedDatabase();
    const firstIds = await exerciseIds();
    await seedDatabase();

    expect(await exerciseIds()).toEqual(firstIds);
    expect(await MuscleGroup.countDocuments()).toBe(muscleGroupNames.length);
  });

  it('gives every muscle group at least one exercise', async () => {
    await seedDatabase();

    for (const group of await MuscleGroup.find()) {
      expect(await Exercise.countDocuments({ belongsTo: group._id }), group.name).toBeGreaterThan(
        0,
      );
    }
  });

  it('logs planks by time', async () => {
    await seedDatabase();
    const plank = await Exercise.findOne({ name: 'plank' });

    expect(plank?.metric).toBe('time');
  });
});
