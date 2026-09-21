import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from './helpers.ts';

describe('GET /health', () => {
  it('reports a connected database', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', database: 'connected' });
  });
});
