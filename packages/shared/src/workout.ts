import { z } from 'zod';
import { objectIdSchema } from './object-id.ts';

export const WORKOUT_MAX_EXERCISES = 20;

// Strict: unknown keys such as `belongsTo` or `$set` are rejected, not silently stripped.
export const workoutInputSchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(3, 'Workout name must be at least 3 characters.')
    .max(60, 'Workout name must be at most 60 characters.'),
  exercises: z
    .array(objectIdSchema)
    .min(1, 'Add at least one exercise.')
    .max(WORKOUT_MAX_EXERCISES, `A workout can have at most ${WORKOUT_MAX_EXERCISES} exercises.`)
    .refine((ids) => new Set(ids).size === ids.length, 'Each exercise can only be added once.'),
});

export type WorkoutInput = z.infer<typeof workoutInputSchema>;
