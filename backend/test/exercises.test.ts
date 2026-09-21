import type { Exercise, MuscleGroup } from '@workout-planner/shared';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { seedDatabase } from '../src/scripts/seed-data.ts';
import { app } from './helpers.ts';

describe('exercises API', () => {
  beforeEach(async () => {
    await seedDatabase();
  });

  it('lists exercises with their muscle groups', async () => {
    const response = await request(app).get('/exercises');

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].belongsTo[0]).toEqual(
      expect.objectContaining({ name: expect.any(String) }),
    );
  });

  it('filters by muscle group names, ignoring case', async () => {
    const response = await request(app)
      .get('/exercises')
      .query({ muscleGroups: 'upper back,CORE' });
    const exercises: Exercise[] = response.body;

    expect(exercises.length).toBeGreaterThan(0);
    for (const exercise of exercises) {
      const groups = exercise.belongsTo.map((group) => group.name);
      expect(groups.some((name) => name === 'Upper Back' || name === 'Core')).toBe(true);
    }
  });

  it('returns 400 for a malformed id and 404 for an unknown one', async () => {
    expect((await request(app).get('/exercises/nope')).status).toBe(400);
    expect((await request(app).get(`/exercises/${'0'.repeat(24)}`)).status).toBe(404);
  });

  it('lists muscle groups', async () => {
    const response = await request(app).get('/musclegroups');
    const groups: MuscleGroup[] = response.body;

    expect(groups.map((group) => group.name)).toContain('Upper Back');
  });
});
