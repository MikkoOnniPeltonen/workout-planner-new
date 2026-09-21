import { describe, expect, it } from 'vitest';
import { passwordRules, signupSchema, workoutInputSchema } from '../src/index.ts';

const exerciseId = 'a'.repeat(24);

describe('signupSchema', () => {
  it('normalizes email and trims name', () => {
    const result = signupSchema.parse({
      name: '  Alex ',
      email: ' Alex@Example.COM ',
      password: 'Secret1',
    });
    expect(result).toEqual({ name: 'Alex', email: 'alex@example.com', password: 'Secret1' });
  });

  it('reports every unmet password rule', () => {
    const result = signupSchema.safeParse({ name: 'A', email: 'a@example.com', password: 'abc' });
    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((issue) => issue.message);
    expect(messages).toEqual([
      'Password needs at least 6 characters.',
      'Password needs one uppercase letter.',
      'Password needs one number.',
    ]);
  });

  it('keeps rule labels in sync with validation', () => {
    expect(passwordRules.every((rule) => rule.test('Secret1'))).toBe(true);
  });
});

describe('workoutInputSchema', () => {
  it('rejects ownership and operator keys', () => {
    const result = workoutInputSchema.safeParse({
      name: 'Leg Day',
      exercises: [exerciseId],
      belongsTo: 'b'.repeat(24),
    });
    expect(result.success).toBe(false);
  });

  it('rejects duplicate exercises and malformed ids', () => {
    expect(
      workoutInputSchema.safeParse({ name: 'Leg Day', exercises: [exerciseId, exerciseId] })
        .success,
    ).toBe(false);
    expect(workoutInputSchema.safeParse({ name: 'Leg Day', exercises: ['nope'] }).success).toBe(
      false,
    );
  });

  it('trims the name', () => {
    expect(workoutInputSchema.parse({ name: '  Leg Day ', exercises: [exerciseId] }).name).toBe(
      'Leg Day',
    );
  });
});
