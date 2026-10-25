import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { User } from '../src/models/User.model.ts';
import { WorkoutSession } from '../src/models/WorkoutSession.model.ts';
import { app, seedExerciseIds } from './helpers.ts';

describe('demo accounts', () => {
  it('creates separate populated accounts with expiring data', async () => {
    await seedExerciseIds();
    const start = () => request(app).post('/auth/demo').set('X-CSRF-Protection', '1').send({});
    const a = await start();
    const b = await start();
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);
    expect(a.body.user._id).not.toBe(b.body.user._id);
    expect(await WorkoutSession.countDocuments({ belongsTo: a.body.user._id })).toBe(36);
    expect((await User.findById(a.body.user._id))?.expiresAt).toBeInstanceOf(Date);
    expect(
      (await WorkoutSession.findOne({ belongsTo: a.body.user._id }))?.expiresAt,
    ).toBeInstanceOf(Date);
  });
});
