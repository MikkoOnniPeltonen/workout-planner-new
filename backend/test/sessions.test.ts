import type { LastPerformance, WorkoutSession } from '@workout-planner/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import type { TestAuth } from './helpers.ts';
import { authed, createUserAndToken, seedExerciseIds } from './helpers.ts';

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(days: number) {
  return new Date(Date.now() - days * DAY_MS).toISOString();
}

function sessionBody(exercises: string[], overrides: Record<string, unknown> = {}) {
  return {
    performedAt: new Date().toISOString(),
    entries: exercises.map((exercise) => ({
      exercise,
      sets: [
        { reps: 8, weightKg: 60 },
        { reps: 6, weightKg: 62.5 },
      ],
    })),
    ...overrides,
  };
}

describe('sessions API', () => {
  let exercises: string[];
  let alice: TestAuth;
  let bob: TestAuth;

  beforeEach(async () => {
    exercises = await seedExerciseIds();
    alice = await createUserAndToken('Alice');
    bob = await createUserAndToken('Bob');
  });

  it('logs a session against a workout and keeps its name after the workout is deleted', async () => {
    const asAlice = authed(alice.sessionCookie);
    const { body: workout } = await asAlice.post('/workouts', { name: 'Leg Day', exercises });

    const response = await asAlice.post(
      '/sessions',
      sessionBody(exercises, { workout: workout._id }),
    );

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      workout: workout._id,
      workoutName: 'Leg Day',
      belongsTo: alice.user._id,
    });
    expect(response.body.entries[0].exercise.belongsTo[0]).toHaveProperty('name');
    expect(response.body.entries[0].sets[0]).toEqual({ reps: 8, weightKg: 60, completed: true });

    await asAlice.delete(`/workouts/${workout._id}`);
    const stored = await asAlice.get(`/sessions/${response.body._id}`);
    expect(stored.body.workoutName).toBe('Leg Day');
  });

  it('names sessions that were not logged against a workout', async () => {
    const response = await authed(alice.sessionCookie).post('/sessions', sessionBody(exercises));

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ workout: null, workoutName: 'Freestyle session' });
  });

  it('validates sets, dates, ownership fields and exercise references', async () => {
    const asAlice = authed(alice.sessionCookie);

    const responses = await Promise.all([
      asAlice.post(
        '/sessions',
        sessionBody(exercises, { entries: [{ exercise: exercises[0], sets: [{ weightKg: 60 }] }] }),
      ),
      asAlice.post('/sessions', sessionBody(exercises, { performedAt: daysAgo(-3) })),
      asAlice.post('/sessions', sessionBody(exercises, { belongsTo: bob.user._id })),
      asAlice.post('/sessions', sessionBody(['0'.repeat(24)])),
    ]);

    expect(responses.map((response) => response.status)).toEqual([400, 400, 400, 400]);
    expect(responses[0].body.message).toBe('Each set needs reps or a duration.');
  });

  it("cannot log a session against someone else's workout", async () => {
    const { body: workout } = await authed(bob.sessionCookie).post('/workouts', {
      name: 'Bob Day',
      exercises,
    });

    const response = await authed(alice.sessionCookie).post(
      '/sessions',
      sessionBody(exercises, { workout: workout._id }),
    );

    expect(response.status).toBe(400);
  });

  it("never exposes or changes another user's session", async () => {
    const { body: session } = await authed(alice.sessionCookie).post(
      '/sessions',
      sessionBody(exercises),
    );
    const asBob = authed(bob.sessionCookie);

    expect((await asBob.get(`/sessions/${session._id}`)).status).toBe(404);
    expect((await asBob.put(`/sessions/${session._id}`, sessionBody(exercises))).status).toBe(404);
    expect((await asBob.delete(`/sessions/${session._id}`)).status).toBe(404);
    expect((await asBob.get('/sessions')).body).toEqual([]);
  });

  it('updates and deletes own sessions', async () => {
    const asAlice = authed(alice.sessionCookie);
    const { body: session } = await asAlice.post(
      '/sessions',
      sessionBody(exercises, { notes: 'Felt strong' }),
    );

    const updated = await asAlice.put(
      `/sessions/${session._id}`,
      sessionBody(exercises.slice(0, 1), {
        performedAt: session.performedAt,
        expectedUpdatedAt: session.updatedAt,
      }),
    );
    expect(updated.status).toBe(200);
    expect(updated.body.entries).toHaveLength(1);
    expect(updated.body.notes).toBeUndefined();

    expect((await asAlice.delete(`/sessions/${session._id}`)).status).toBe(204);
    expect((await asAlice.get(`/sessions/${session._id}`)).status).toBe(404);
  });

  it('lists sessions newest first and pages with `before`', async () => {
    const asAlice = authed(alice.sessionCookie);
    for (const days of [3, 1, 2]) {
      await asAlice.post('/sessions', sessionBody(exercises, { performedAt: daysAgo(days) }));
    }

    const firstPage = await asAlice.get('/sessions?limit=2');
    const [newest, second]: WorkoutSession[] = firstPage.body;
    expect(firstPage.body).toHaveLength(2);
    expect(Date.parse(newest.performedAt)).toBeGreaterThan(Date.parse(second.performedAt));

    const nextPage = await asAlice.get(
      `/sessions?limit=2&before=${encodeURIComponent(second.performedAt)}`,
    );
    expect(nextPage.body).toHaveLength(1);
  });

  it('returns the most recent sets for each exercise', async () => {
    const asAlice = authed(alice.sessionCookie);
    const [first, second] = exercises;
    await asAlice.post('/sessions', {
      performedAt: daysAgo(2),
      entries: [
        { exercise: first, sets: [{ reps: 5, weightKg: 50 }] },
        { exercise: second, sets: [{ reps: 10 }] },
      ],
    });
    await asAlice.post('/sessions', {
      performedAt: daysAgo(1),
      entries: [{ exercise: first, sets: [{ reps: 5, weightKg: 55 }] }],
    });

    const response = await asAlice.get(`/sessions/last-performance?exercises=${first},${second}`);
    const rows: LastPerformance[] = response.body;
    const setsByExercise = Object.fromEntries(rows.map((row) => [row.exercise, row.sets]));

    expect(response.status).toBe(200);
    expect(setsByExercise[first]).toEqual([{ reps: 5, weightKg: 55, completed: true }]);
    expect(setsByExercise[second]).toEqual([{ reps: 10, completed: true }]);

    const asBob = await authed(bob.sessionCookie).get(
      `/sessions/last-performance?exercises=${first}`,
    );
    expect(asBob.body).toEqual([]);
  });
  it('pages and exports timestamp ties without skipping sessions', async () => {
    const asAlice = authed(alice.sessionCookie);
    const performedAt = daysAgo(1);
    for (let i = 0; i < 5; i++)
      await asAlice.post('/sessions', sessionBody(exercises, { performedAt }));
    const seen = new Set<string>();
    let before = '';
    for (let i = 0; i < 3; i++) {
      const page = (
        await asAlice.get(
          `/sessions?limit=2${before ? `&before=${encodeURIComponent(before)}` : ''}`,
        )
      ).body;
      for (const session of page) {
        expect(seen.has(session._id)).toBe(false);
        seen.add(session._id);
      }
      const last = page.at(-1);
      if (last) before = `${last.performedAt}~${last._id}`;
    }
    expect(seen.size).toBe(5);
  });
  it('deduplicates concurrent retries and rejects reusing an id for different input', async () => {
    const input = sessionBody(exercises, { clientRequestId: crypto.randomUUID() });
    const send = (body: object = input) =>
      authed(alice.sessionCookie).post('/sessions', body).set('X-Session-Owner', alice.user._id);
    const [a, b] = await Promise.all([send(), send()]);
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);
    expect(a.body._id).toBe(b.body._id);
    expect((await send({ ...input, notes: 'different' })).status).toBe(409);
    expect((await authed(alice.sessionCookie).get('/sessions')).body).toHaveLength(1);
    expect(
      (
        await authed(bob.sessionCookie)
          .post('/sessions', input)
          .set('X-Session-Owner', alice.user._id)
      ).status,
    ).toBe(409);
  });
  it('rejects stale edits without overwriting the first update', async () => {
    const client = authed(alice.sessionCookie);
    const { body: session } = await client.post('/sessions', sessionBody(exercises));
    const update = sessionBody(exercises, {
      expectedUpdatedAt: session.updatedAt,
      notes: 'first edit',
    });
    expect((await client.put(`/sessions/${session._id}`, update)).status).toBe(200);
    expect(
      (await client.put(`/sessions/${session._id}`, { ...update, notes: 'stale edit' })).status,
    ).toBe(409);
    expect((await client.get(`/sessions/${session._id}`)).body.notes).toBe('first edit');
  });
  it('uses the whole recency window, including more than one history page', async () => {
    const client = authed(alice.sessionCookie);
    await client.post('/sessions', sessionBody([exercises[0]], { performedAt: daysAgo(2) }));
    for (let i = 0; i < 21; i++)
      await client.post('/sessions', sessionBody([exercises[1]], { performedAt: daysAgo(1) }));
    expect((await client.get('/sessions/recent-exercises')).body.sort()).toEqual(
      exercises.slice(0, 2).sort(),
    );
    expect((await authed(bob.sessionCookie).get('/sessions/recent-exercises')).body).toEqual([]);
  });
});
