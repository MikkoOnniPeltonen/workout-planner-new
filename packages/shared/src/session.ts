import { z } from 'zod';
import { objectIdSchema } from './object-id.ts';

export const SESSION_MAX_ENTRIES = 30;
export const SESSION_MAX_SETS = 20;

// Allows for clocks that are a little ahead; anything later is a mistake.
const MAX_FUTURE_MS = 24 * 60 * 60 * 1000;

export const sessionSetSchema = z
  .strictObject({
    reps: z.number().int('Reps must be a whole number.').min(0).max(1000).optional(),
    weightKg: z.number().min(0).max(1000).optional(),
    durationSec: z.number().int('Duration must be whole seconds.').min(0).max(86_400).optional(),
    completed: z.boolean().default(true),
  })
  .refine(
    (set) => set.reps !== undefined || set.durationSec !== undefined,
    'Each set needs reps or a duration.',
  );

export const sessionEntrySchema = z.strictObject({
  exercise: objectIdSchema,
  sets: z
    .array(sessionSetSchema)
    .min(1, 'Log at least one set per exercise.')
    .max(SESSION_MAX_SETS, `An exercise can have at most ${SESSION_MAX_SETS} sets.`),
});

const sessionFields = {
  performedAt: z.iso
    .datetime({ offset: true, error: 'Provide a valid date and time.' })
    .refine((value) => Date.parse(value) <= Date.now() + MAX_FUTURE_MS, {
      error: 'A session cannot be in the future.',
    }),
  durationMinutes: z.number().int().min(1).max(600).optional(),
  notes: z.string().trim().max(500, 'Notes must be at most 500 characters.').optional(),
  entries: z
    .array(sessionEntrySchema)
    .min(1, 'Log at least one exercise.')
    .max(SESSION_MAX_ENTRIES, `A session can have at most ${SESSION_MAX_ENTRIES} exercises.`)
    .refine(
      (entries) => new Set(entries.map((entry) => entry.exercise)).size === entries.length,
      'Each exercise can only be logged once per session.',
    ),
};

export const sessionInputSchema = z.strictObject({
  ...sessionFields,
  /** The workout this session followed; omit for a freestyle session. */
  clientRequestId: z.uuid().optional(),
  workout: objectIdSchema.optional(),
  /** Name for a freestyle session. Ignored when `workout` is set. */
  workoutName: z.string().trim().min(1).max(60).optional(),
});

/** Editing a session keeps the workout it was logged against. */
export const sessionUpdateSchema = z.strictObject({
  ...sessionFields,
  expectedUpdatedAt: z.iso.datetime().optional(),
});

export type SessionInput = z.infer<typeof sessionInputSchema>;
export type SessionUpdateInput = z.infer<typeof sessionUpdateSchema>;
