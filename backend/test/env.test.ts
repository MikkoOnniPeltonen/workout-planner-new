import { describe, expect, it } from 'vitest';
import { parseEnv } from '../src/config/env.ts';

describe('parseEnv', () => {
  it('fails fast without TOKEN_SECRET', () => {
    expect(() => parseEnv({})).toThrow(/TOKEN_SECRET/);
  });

  it('rejects a short TOKEN_SECRET', () => {
    expect(() => parseEnv({ TOKEN_SECRET: 'too-short' })).toThrow(/at least 32 characters/);
  });

  it('applies defaults and splits CORS origins', () => {
    const env = parseEnv({
      TOKEN_SECRET: 'x'.repeat(32),
      CORS_ORIGIN: 'http://a.test, http://b.test',
    });

    expect(env.PORT).toBe(3000);
    expect(env.NODE_ENV).toBe('development');
    expect(env.CORS_ORIGIN).toEqual(['http://a.test', 'http://b.test']);
  });
});
