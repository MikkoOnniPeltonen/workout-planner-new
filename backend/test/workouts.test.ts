import type { AuthResponse } from '@workout-planner/shared';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { Workout } from '../src/models/Workout.model.ts';
import { app, authed, createUserAndToken, seedExerciseIds } from './helpers.ts';

describe('workouts API', () => {
  let exercises: string[];
  let alice: AuthResponse;
  let bob: AuthResponse;

  beforeEach(async () => {
    exercises = await seedExerciseIds();
    alice = await createUserAndToken('Alice');
    bob = await createUserAndToken('Bob');
  });

  it('creates a workout with populated exercises and keeps the name as typed', async () => {
    const response = await authed(alice.authToken).post('/workouts', {
      name: 'Leg Day',
      exercises,
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ name: 'Leg Day', belongsTo: alice.user._id });
    expect(response.body.exercises).toHaveLength(exercises.length);
    expect(response.body.exercises[0].belongsTo[0]).toHaveProperty('name');
  });

  it('requires authentication on every route', async () => {
    const { body: workout } = await authed(alice.authToken).post('/workouts', {
      name: 'Leg Day',
      exercises,
    });

    const responses = await Promise.all([
      request(app).get('/workouts'),
      request(app).get(`/workouts/${workout._id}`),
      request(app).post('/workouts').send({ name: 'Leg Day', exercises }),
      request(app).put(`/workouts/${workout._id}`).send({ name: 'Leg Day', exercises }),
      request(app).delete(`/workouts/${workout._id}`),
    ]);

    expect(responses.map((response) => response.status)).toEqual([401, 401, 401, 401, 401]);
  });

  it("never exposes or changes another user's workout", async () => {
    const { body: workout } = await authed(alice.authToken).post('/workouts', {
      name: 'Leg Day',
      exercises,
    });
    const asBob = authed(bob.authToken);

    expect((await asBob.get(`/workouts/${workout._id}`)).status).toBe(404);
    expect(
      (await asBob.put(`/workouts/${workout._id}`, { name: 'Mine now', exercises })).status,
    ).toBe(404);
    expect((await asBob.delete(`/workouts/${workout._id}`)).status).toBe(404);
    expect((await asBob.get('/workouts')).body).toEqual([]);

    const stored = await Workout.findById(workout._id);
    expect(stored?.name).toBe('Leg Day');
  });

  it('rejects attempts to reassign ownership or inject update operators', async () => {
    const asAlice = authed(alice.authToken);
    const { body: workout } = await asAlice.post('/workouts', { name: 'Leg Day', exercises });

    const responses = await Promise.all([
      asAlice.put(`/workouts/${workout._id}`, {
        name: 'Leg Day',
        exercises,
        belongsTo: bob.user._id,
      }),
      asAlice.put(`/workouts/${workout._id}`, { $set: { belongsTo: bob.user._id } }),
      asAlice.post('/workouts', { name: 'Arm Day', exercises, belongsTo: bob.user._id }),
    ]);

    expect(responses.map((response) => response.status)).toEqual([400, 400, 400]);
    const stored = await Workout.findById(workout._id);
    expect(String(stored?.belongsTo)).toBe(alice.user._id);
  });

  it('allows the same name for different users but not twice for one user', async () => {
    expect(
      (await authed(alice.authToken).post('/workouts', { name: 'Leg Day', exercises })).status,
    ).toBe(201);
    expect(
      (await authed(bob.authToken).post('/workouts', { name: 'Leg Day', exercises })).status,
    ).toBe(201);

    const duplicate = await authed(alice.authToken).post('/workouts', {
      name: 'leg day',
      exercises,
    });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.message).toBe('You already have a workout with this name.');
  });

  it('validates ids and exercise references', async () => {
    const asAlice = authed(alice.authToken);

    expect((await asAlice.get('/workouts/not-an-id')).status).toBe(400);
    expect(
      (await asAlice.post('/workouts', { name: 'Leg Day', exercises: ['0'.repeat(24)] })).status,
    ).toBe(400);
    expect((await asAlice.post('/workouts', { name: 'Leg Day', exercises: [] })).status).toBe(400);
  });

  it("updates and deletes the owner's workout", async () => {
    const asAlice = authed(alice.authToken);
    const { body: workout } = await asAlice.post('/workouts', { name: 'Leg Day', exercises });

    const updated = await asAlice.put(`/workouts/${workout._id}`, {
      name: 'Heavy Leg Day',
      exercises: exercises.slice(0, 1),
    });
    expect(updated.status).toBe(200);
    expect(updated.body.name).toBe('Heavy Leg Day');
    expect(updated.body.exercises).toHaveLength(1);

    expect((await asAlice.delete(`/workouts/${workout._id}`)).status).toBe(204);
    expect((await asAlice.get(`/workouts/${workout._id}`)).status).toBe(404);
  });
});
