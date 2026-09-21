import type { AuthResponse } from '@workout-planner/shared';
import request from 'supertest';
import { createApp } from '../src/app.ts';
import { Exercise } from '../src/models/Exercise.model.ts';
import { seedDatabase } from '../src/scripts/seed-data.ts';

export const app = createApp();

let userCount = 0;

export async function createUserAndToken(name = 'Test User'): Promise<AuthResponse> {
  userCount += 1;
  const response = await request(app)
    .post('/auth/signup')
    .send({ name, email: `user${userCount}@example.com`, password: 'Secret123' });

  if (response.status !== 201) {
    throw new Error(`Signup failed with ${response.status}: ${JSON.stringify(response.body)}`);
  }
  return response.body;
}

export async function seedExerciseIds(count = 3): Promise<string[]> {
  await seedDatabase();
  const exercises = await Exercise.find().sort({ name: 1 }).limit(count);
  return exercises.map((exercise) => String(exercise._id));
}

/** Supertest requests carrying a bearer token. */
export function authed(token: string) {
  const authorization = `Bearer ${token}`;
  return {
    get: (url: string) => request(app).get(url).set('Authorization', authorization),
    post: (url: string, body: object) =>
      request(app).post(url).set('Authorization', authorization).send(body),
    put: (url: string, body: object) =>
      request(app).put(url).set('Authorization', authorization).send(body),
    delete: (url: string) => request(app).delete(url).set('Authorization', authorization),
  };
}
