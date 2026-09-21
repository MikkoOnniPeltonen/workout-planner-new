import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from './helpers.ts';

const credentials = { name: 'Alice', email: 'Alice@Example.com', password: 'Secret123' };

describe('auth API', () => {
  it('signs up, returns a token, and never exposes the password', async () => {
    const signup = await request(app).post('/auth/signup').send(credentials);

    expect(signup.status).toBe(201);
    expect(signup.body.user).toEqual({
      _id: expect.any(String),
      name: 'Alice',
      email: 'alice@example.com',
    });

    const verify = await request(app)
      .get('/auth/verify')
      .set('Authorization', `Bearer ${signup.body.authToken}`);
    expect(verify.status).toBe(200);
    expect(verify.body).toEqual(signup.body.user);
  });

  it('rejects a duplicate email regardless of casing', async () => {
    await request(app).post('/auth/signup').send(credentials);
    const duplicate = await request(app)
      .post('/auth/signup')
      .send({ ...credentials, email: 'ALICE@example.com' });

    expect(duplicate.status).toBe(409);
  });

  it('explains which password rule is not met', async () => {
    const response = await request(app)
      .post('/auth/signup')
      .send({ ...credentials, password: 'secret123' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Password needs one uppercase letter.');
  });

  it('logs in with any email casing', async () => {
    await request(app).post('/auth/signup').send(credentials);
    const login = await request(app)
      .post('/auth/login')
      .send({ email: 'alice@EXAMPLE.com', password: credentials.password });

    expect(login.status).toBe(200);
    expect(login.body.authToken).toEqual(expect.any(String));
    expect(login.body.user.email).toBe('alice@example.com');
  });

  it('gives the same answer for an unknown email and a wrong password', async () => {
    await request(app).post('/auth/signup').send(credentials);
    const wrongPassword = await request(app)
      .post('/auth/login')
      .send({ email: credentials.email, password: 'Wrong1234' });
    const unknownEmail = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@example.com', password: credentials.password });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
  });

  it('rejects missing, malformed, and foreign tokens', async () => {
    const foreignToken = jwt.sign(
      { _id: 'x', email: 'x@example.com', name: 'X' },
      'a-different-secret-that-is-long-enough',
    );
    const responses = await Promise.all([
      request(app).get('/auth/verify'),
      request(app).get('/auth/verify').set('Authorization', 'Bearer not-a-token'),
      request(app).get('/auth/verify').set('Authorization', `Bearer ${foreignToken}`),
    ]);

    expect(responses.map((response) => response.status)).toEqual([401, 401, 401]);
  });
});
