import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { AuthSession } from '../src/models/AuthSession.model.ts';
import { app, authed, createUserAndToken } from './helpers.ts';

const credentials = { name: 'Alice', email: 'Alice@Example.com', password: 'Secret12345674567' };
const signup = () =>
  request(app).post('/auth/signup').set('X-CSRF-Protection', '1').send(credentials);

describe('cookie authentication', () => {
  it('issues HttpOnly SameSite cookies without exposing credentials to JavaScript', async () => {
    const response = await signup();
    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      user: { _id: expect.any(String), name: 'Alice', email: 'alice@example.com' },
    });
    const cookie = response.headers['set-cookie'][0];
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Strict');
    const verify = await request(app).get('/auth/verify').set('Cookie', cookie.split(';')[0]);
    expect(verify.body).toEqual(response.body.user);
    const stored = await AuthSession.findOne().select('+tokenHash');
    expect(stored?.tokenHash).not.toBe(cookie.split(';')[0].split('=')[1]);
  });
  it('revokes the session on logout, including replay of the old cookie', async () => {
    const user = await createUserAndToken();
    expect((await authed(user.sessionCookie).post('/auth/logout', {})).status).toBe(204);
    expect((await authed(user.sessionCookie).get('/auth/verify')).status).toBe(401);
  });
  it('rejects expired, malformed and missing sessions', async () => {
    const user = await createUserAndToken();
    await AuthSession.updateMany({}, { expiresAt: new Date(0) });
    expect((await authed(user.sessionCookie).get('/auth/verify')).status).toBe(401);
    expect((await authed('workout-session=bad').get('/auth/verify')).status).toBe(401);
    expect((await request(app).get('/auth/verify')).status).toBe(401);
  });
  it('rejects cross-origin writes and simple form submissions, including login', async () => {
    expect((await request(app).post('/auth/signup').send(credentials)).status).toBe(403);
    expect(
      (
        await request(app)
          .post('/auth/signup')
          .set('X-CSRF-Protection', '1')
          .set('Origin', 'https://evil.example')
          .send(credentials)
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .post('/auth/signup')
          .set('X-CSRF-Protection', '1')
          .set('Origin', 'http://localhost:5173')
          .send(credentials)
      ).status,
    ).toBe(201);
  });
  it('normalizes emails, rejects duplicates, and logs in', async () => {
    await signup();
    expect((await signup()).status).toBe(409);
    const response = await request(app)
      .post('/auth/login')
      .set('X-CSRF-Protection', '1')
      .send({ email: 'ALICE@example.com', password: credentials.password });
    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('alice@example.com');
  });
  it('returns the same error for unknown email and wrong password', async () => {
    await signup();
    const attempt = (email: string) =>
      request(app)
        .post('/auth/login')
        .set('X-CSRF-Protection', '1')
        .send({ email, password: 'Wrong1234567' });
    const wrong = await attempt(credentials.email);
    const unknown = await attempt('nobody@example.com');
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body).toEqual(unknown.body);
  });
});
