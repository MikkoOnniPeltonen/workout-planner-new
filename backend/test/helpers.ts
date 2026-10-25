import type { AuthResponse } from '@workout-planner/shared';
import request from 'supertest';
import { createApp } from '../src/app.ts';
import { Exercise } from '../src/models/Exercise.model.ts';
import { seedDatabase } from '../src/scripts/seed-data.ts';

export const app = createApp();

export interface TestAuth extends AuthResponse {
  sessionCookie: string;
}

let userCount = 0;

export async function createUserAndToken(name = 'Test User'): Promise<TestAuth> {
  userCount += 1;
  const response = await request(app)
    .post('/auth/signup')
    .set('X-CSRF-Protection', '1')
    .send({ name, email: `user${userCount}@example.com`, password: 'Secret1234567' });

  if (response.status !== 201) {
    throw new Error(`Signup failed with ${response.status}: ${JSON.stringify(response.body)}`);
  }
  return { ...response.body, sessionCookie: response.headers['set-cookie'][0].split(';')[0] };
}

export async function seedExerciseIds(count = 3): Promise<string[]> {
  await seedDatabase();
  const exercises = await Exercise.find().sort({ name: 1 }).limit(count);
  return exercises.map((exercise) => String(exercise._id));
}

/** Supertest requests carrying the session cookie and CSRF header. */
export function authed(cookie: string) {
  return {
    get: (url: string) => request(app).get(url).set('Cookie', cookie).set('X-CSRF-Protection', '1'),
    post: (url: string, body: object) =>
      request(app).post(url).set('Cookie', cookie).set('X-CSRF-Protection', '1').send(body),
    put: (url: string, body: object) =>
      request(app).put(url).set('Cookie', cookie).set('X-CSRF-Protection', '1').send(body),
    delete: (url: string) =>
      request(app).delete(url).set('Cookie', cookie).set('X-CSRF-Protection', '1'),
  };
}
