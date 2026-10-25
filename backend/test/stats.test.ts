import type { Types } from 'mongoose';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { Exercise } from '../src/models/Exercise.model.ts';
import { Workout } from '../src/models/Workout.model.ts';
import { WorkoutSession } from '../src/models/WorkoutSession.model.ts';
import { seedDatabase } from '../src/scripts/seed-data.ts';
import { statsService } from '../src/services/stats.service.ts';
import { addWeeks, weekStartKey, weekStreak } from '../src/utils/weeks.ts';
import { app, authed, createUserAndToken } from './helpers.ts';

describe('week helpers', () => {
  it('finds the Monday of the week in the given time zone', () => {
    // Monday 00:30 in Helsinki is still Sunday evening in UTC.
    const earlyMondayInHelsinki = new Date('2026-09-13T21:30:00Z');
    expect(weekStartKey(earlyMondayInHelsinki, 'Europe/Helsinki')).toBe('2026-09-14');
    expect(weekStartKey(earlyMondayInHelsinki, 'UTC')).toBe('2026-09-07');

    // Sunday 23:30 in New York is already Monday in UTC.
    const lateSundayInNewYork = new Date('2026-09-14T03:30:00Z');
    expect(weekStartKey(lateSundayInNewYork, 'America/New_York')).toBe('2026-09-07');
    expect(weekStartKey(lateSundayInNewYork, 'UTC')).toBe('2026-09-14');
  });

  it('keeps a streak alive until the current week is over', () => {
    const active = new Set(['2026-08-24', '2026-08-31', '2026-09-07']);

    expect(weekStreak(active, '2026-09-14')).toBe(3);
    expect(weekStreak(new Set([...active, '2026-09-14']), '2026-09-14')).toBe(4);
    expect(weekStreak(new Set(['2026-08-24', '2026-09-07']), '2026-09-14')).toBe(1);
  });

  it('shifts weeks across month and year boundaries', () => {
    expect(addWeeks('2026-08-31', 1)).toBe('2026-09-07');
    expect(addWeeks('2026-01-05', -1)).toBe('2025-12-29');
  });
});

describe('statsService', () => {
  const now = new Date('2026-09-15T09:00:00Z'); // a Tuesday
  let userId: string;

  beforeEach(async () => {
    await seedDatabase();
    ({
      user: { _id: userId },
    } = await createUserAndToken());
  });

  function logSession(
    performedAt: string,
    entries: { exercise: Types.ObjectId; sets: object[] }[],
    workout: Types.ObjectId | null = null,
  ) {
    return WorkoutSession.create({
      belongsTo: userId,
      workout,
      workoutName: 'Test session',
      performedAt: new Date(performedAt),
      entries,
    });
  }

  it("buckets sessions into weeks in the user's time zone, counting completed sets only", async () => {
    const squat = await Exercise.findOne({ name: 'squat' }).orFail();
    await logSession('2026-09-13T21:30:00Z', [
      {
        exercise: squat._id,
        sets: [
          { reps: 5, weightKg: 100 },
          { reps: 5, weightKg: 100, completed: false },
        ],
      },
    ]);

    const helsinki = await statsService.getStats(userId, {
      weeks: 2,
      timeZone: 'Europe/Helsinki',
      now,
    });
    const utc = await statsService.getStats(userId, { weeks: 2, timeZone: 'UTC', now });

    expect(helsinki.weekly).toEqual([
      { weekStart: '2026-09-07', sessions: 0, sets: 0, volumeKg: 0 },
      { weekStart: '2026-09-14', sessions: 1, sets: 1, volumeKg: 500 },
    ]);
    expect(utc.weekly.map((week) => week.sessions)).toEqual([1, 0]);
  });

  it('summarises streaks, muscle groups, records and recency', async () => {
    const squat = await Exercise.findOne({ name: 'squat' }).orFail(); // Legs, Core
    const bench = await Exercise.findOne({ name: 'bench press' }).orFail(); // Chest, Arms
    const workout = await Workout.create({
      name: 'Full Body',
      belongsTo: userId,
      exercises: [squat._id, bench._id],
    });

    await logSession(
      '2026-09-01T17:00:00Z',
      [{ exercise: squat._id, sets: [{ reps: 5, weightKg: 100 }] }],
      workout._id,
    );
    await logSession(
      '2026-09-08T17:00:00Z',
      [
        {
          exercise: squat._id,
          sets: [
            { reps: 3, weightKg: 110 },
            { reps: 5, weightKg: 100 },
          ],
        },
        { exercise: bench._id, sets: [{ reps: 8, weightKg: 70 }] },
      ],
      workout._id,
    );

    const stats = await statsService.getStats(userId, {
      weeks: 4,
      timeZone: 'Europe/Helsinki',
      now,
    });

    expect(stats.totalSessions).toBe(2);
    // Weeks of 31 Aug and 7 Sep; the current week has no session yet but is not over.
    expect(stats.currentWeekStreak).toBe(2);
    expect(stats.setsPerMuscleGroup).toEqual(
      expect.arrayContaining([
        { muscleGroup: 'Legs', sets: 3 },
        { muscleGroup: 'Core', sets: 3 },
        { muscleGroup: 'Chest', sets: 1 },
        { muscleGroup: 'Arms', sets: 1 },
      ]),
    );
    // 110 kg × 3 → 121 kg estimated, which beats 100 kg × 5 → 116.5 kg.
    expect(stats.personalRecords.find((record) => record.exerciseName === 'squat')).toMatchObject({
      bestE1rmKg: 121,
      weightKg: 110,
      reps: 3,
    });
    expect(stats.lastPerformedByWorkout[String(workout._id)]).toBe('2026-09-08T17:00:00.000Z');
    expect(stats.lastTrainedByMuscleGroup.Chest).toBe('2026-09-08T17:00:00.000Z');
    // 5×100 + 3×110 + 5×100 + 8×70
    expect(stats.totals).toEqual({ sessions: 2, sets: 4, volumeKg: 1890 });
    expect(stats.previousTotals).toEqual({ sessions: 0, sets: 0, volumeKg: 0 });

    // Muscle group sets follow the selected range, like every other number.
    const thisWeekOnly = await statsService.getStats(userId, {
      weeks: 1,
      timeZone: 'Europe/Helsinki',
      now,
    });
    expect(thisWeekOnly.setsPerMuscleGroup).toEqual([]);
    expect(thisWeekOnly.previousTotals).toEqual({ sessions: 1, sets: 3, volumeKg: 1390 });
  });

  it('is served over the API with a validated time zone', async () => {
    const { sessionCookie } = await createUserAndToken();

    expect((await request(app).get('/sessions/stats')).status).toBe(401);
    expect((await authed(sessionCookie).get('/sessions/stats?tz=Mars/Olympus')).status).toBe(400);

    const response = await authed(sessionCookie).get('/sessions/stats?tz=Europe/Helsinki&weeks=6');
    expect(response.status).toBe(200);
    expect(response.body.weekly).toHaveLength(6);
    expect(response.body.currentWeekStreak).toBe(0);
  });
});
