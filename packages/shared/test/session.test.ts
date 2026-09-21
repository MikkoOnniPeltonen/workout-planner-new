import { describe, expect, it } from 'vitest';
import { sessionInputSchema, sessionUpdateSchema } from '../src/index.ts';

const DAY_MS = 24 * 60 * 60 * 1000;
const exerciseId = 'a'.repeat(24);

function session(overrides: Record<string, unknown> = {}) {
  return {
    performedAt: new Date().toISOString(),
    entries: [{ exercise: exerciseId, sets: [{ reps: 8, weightKg: 60 }] }],
    ...overrides,
  };
}

function firstMessage(input: unknown) {
  return sessionInputSchema.safeParse(input).error?.issues[0]?.message;
}

describe('sessionInputSchema', () => {
  it('treats sets as completed unless stated otherwise', () => {
    expect(sessionInputSchema.parse(session()).entries[0].sets[0].completed).toBe(true);
  });

  it('requires reps or a duration on every set', () => {
    const input = session({ entries: [{ exercise: exerciseId, sets: [{ weightKg: 60 }] }] });
    expect(firstMessage(input)).toBe('Each set needs reps or a duration.');
  });

  it('accepts timed sets', () => {
    const input = session({ entries: [{ exercise: exerciseId, sets: [{ durationSec: 45 }] }] });
    expect(sessionInputSchema.safeParse(input).success).toBe(true);
  });

  it('rejects sessions in the future', () => {
    const input = session({ performedAt: new Date(Date.now() + 2 * DAY_MS).toISOString() });
    expect(firstMessage(input)).toBe('A session cannot be in the future.');
  });

  it('rejects logging the same exercise twice', () => {
    const entry = { exercise: exerciseId, sets: [{ reps: 5 }] };
    expect(firstMessage(session({ entries: [entry, entry] }))).toBe(
      'Each exercise can only be logged once per session.',
    );
  });

  it('does not let updates move a session to another workout', () => {
    expect(sessionUpdateSchema.safeParse(session({ workout: 'b'.repeat(24) })).success).toBe(false);
  });
});
